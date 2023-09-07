import request from 'supertest';
import jwt from 'jsonwebtoken';
import {
  getConnectionOptions,
  createConnection,
  Connection,
  getRepository,
} from 'typeorm';

import { app } from '../../../../../../app';

import User from '../../../../../users/infra/typeorm/entities/user';
import MailtrapProvider from '../../../../../../shared/providers/mail/implementations/mailtrap-provider';

describe('AuthController Tests', () => {
  let connection: Connection;

  beforeAll(async () => {
    const connectionOptions = await getConnectionOptions('test');
    connection = await createConnection({
      ...connectionOptions,
      name: 'default',
    });
  });

  afterAll(async () => {
    await connection.close();
  });

  beforeEach(async () => {
    jest
      .spyOn(MailtrapProvider.prototype, 'send')
      .mockImplementation(jest.fn());
  });

  afterEach(async () => {
    const usersRepository = getRepository(User);
    await usersRepository.clear();
  });

  it('should return status code 200 when token is valid', async () => {
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
      }
    );

    const responseSignin = await request(app).post('/signin').send({
      email: 'teste@teste.com',
      password: 'teste1234',
    });

    const token = responseSignin.body.token;

    const response = await request(app).post('/validate-token').send({
      token,
    });

    expect(response.status).toBe(200);
  });

  it('should return an error when token is not informed', async () => {
    const response = await request(app).post('/validate-token').send();

    expect(response.body).toEqual({
      messagesError: ['Token não informado!'],
    });
    expect(response.status).toBe(400);
  });

  it('should return an error when the user of token not exists', async () => {
    const token = jwt.sign({ id: 'teste' }, process.env.AUTH_SECRET as string, {
      expiresIn: '1d',
    });
    const response = await request(app).post('/validate-token').send({
      token,
    });

    expect(response.body).toEqual({
      messagesError: ['Usuário não encontrado!'],
    });
    expect(response.status).toBe(400);
  });
});
