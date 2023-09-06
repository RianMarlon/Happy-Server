import request from 'supertest';
import {
  getConnectionOptions,
  createConnection,
  Connection,
  getRepository,
} from 'typeorm';
import jwt from 'jsonwebtoken';

import { app } from '../../app';

import User from '../../modules/users/infra/typeorm/entities/user';

describe('authAdmin Tests', () => {
  let connection: Connection;
  let accessToken: string;

  beforeAll(async () => {
    const connectionOptions = await getConnectionOptions('test');
    connection = await createConnection({
      ...connectionOptions,
      name: 'default',
    });
    await request(app).post('/signup').send({
      first_name: 'Teste',
      last_name: 'Teste',
      email: 'teste@teste.com',
      password: 'teste1234',
      confirm_password: 'teste1234',
    });
    const usersRepository = getRepository(User);
    await usersRepository.update(
      {
        email: 'teste@teste.com',
      },
      {
        verified_email: true,
        admin: true,
      }
    );
    const response = await request(app).post('/signin').send({
      email: 'teste@teste.com',
      password: 'teste1234',
    });
    accessToken = response.body.token;
  });

  afterAll(async () => {
    const usersRepository = getRepository(User);
    await usersRepository.clear();
    await connection.close();
  });

  it('should call the next function when the user is authorized', async () => {
    const response = await request(app)
      .get('/orphanages-pending')
      .set({ Authorization: `Basic ${accessToken}` });

    expect(response.status).toBe(200);
  });

  it('should return an error when the token is not informed', async () => {
    const response = await request(app).get('/orphanages-pending');

    expect(response.body).toEqual({
      messagesError: ['Acesso não autorizado!'],
    });
    expect(response.status).toBe(401);
  });

  it('should return an error when the token is invalid', async () => {
    const response = await request(app)
      .get('/orphanages-pending')
      .set({ Authorization: 'Basic ' });

    expect(response.body).toEqual({
      messagesError: ['Acesso não autorizado!'],
    });
    expect(response.status).toBe(401);
  });

  it('should return an error when the user of token not exists', async () => {
    const token = jwt.sign({ id: 3 }, process.env.AUTH_SECRET as string, {
      expiresIn: '30m',
    });

    const response = await request(app)
      .get('/orphanages-pending')
      .set({ Authorization: `Basic ${token}` });

    expect(response.body).toEqual({
      messagesError: ['Acesso não autorizado!'],
    });
    expect(response.status).toBe(401);
  });
});
