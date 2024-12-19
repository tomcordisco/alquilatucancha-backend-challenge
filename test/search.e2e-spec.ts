import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import Redis from 'ioredis';
import { AppModule } from '../src/app.module';

describe('SearchController (e2e)', () => {
  let app: INestApplication;
  let redisClient: Redis;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10), 
      });
      
  });

  afterAll(async () => {
    await redisClient.quit();
    await app.close();
  });

  it('/search (GET) debe devolver datos y almacenarlos en Redis', async () => {
    const placeId = 'ChIJoYUAHyvmopUR4xJzVPBE_Lw';
    const date = '2022-08-25';
    const cacheKey = `search:${placeId}:${date}`;

    // tenes que validar que la clave no exita antes del test 
    await redisClient.del(cacheKey);

    const response = await request(app.getHttpServer())
      .get(`/search?placeId=${placeId}&date=${date}`)
      .expect(200);

    // verifica que se devuelva una respuesta valida
    expect(response.body).toBeDefined();
    expect(Array.isArray(response.body)).toBeTruthy();

    // Verificar que los datos se almacenaron en Redis
    const cachedData = await redisClient.get(cacheKey);
    expect(cachedData).not.toBeNull();
    expect(cachedData).not.toBeNull();
    if (cachedData) {
      expect(JSON.parse(cachedData)).toEqual(response.body);
    }
      });

  it('/search (GET) debe devolver datos de Redis en un cache hit', async () => {
    const placeId = 'ChIJoYUAHyvmopUR4xJzVPBE_Lw';
    const date = '2022-08-25';
    const cacheKey = `search:${placeId}:${date}`;

    // simular datos almacenados en redis
    const mockData = [{ id: 1, name: 'Mock Club' }];
    await redisClient.set(cacheKey, JSON.stringify(mockData), 'EX', 300);

    const response = await request(app.getHttpServer())
      .get(`/search?placeId=${placeId}&date=${date}`)
      .expect(200);

    // verificar que la respuesta coincide con los datos en redis
    expect(response.body).toEqual(mockData);
  });

  it('debe invalidar las claves en Redis tras un evento', async () => {
    const slotKey = 'slots:137:490:2022-08-25';

    // simular datos almacenados 
    await redisClient.set(slotKey, JSON.stringify({ available: true }), 'EX', 300);

    // se envia un evento que invalide la clave
    await request(app.getHttpServer())
      .post('/events')
      .send({
        type: 'booking_created',
        clubId: 137,
        courtId: 490,
        slot: {
          datetime: '2022-08-25T10:00:00Z',
        },
      })
      .expect(201);

    // se comprueba si se elimino o no la clave
    const cachedData = await redisClient.get(slotKey);
    expect(cachedData).toBeNull();
  });
});
