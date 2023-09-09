import request from 'supertest';
import {
  getConnectionOptions,
  createConnection,
  Connection,
  getRepository,
} from 'typeorm';

import { app } from '../../../../../../shared/infra/http/app';

import User from '../../../../../users/infra/typeorm/entities/user';
import Image from '../../../../../images/infra/typeorm/entities/image';
import Orphanage from '../../../typeorm/entities/orphanage';

import MailtrapProvider from '../../../../../../shared/providers/mail/implementations/mailtrap-provider';

interface IUserData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

async function createUserAndReturnAccessToken(
  data: IUserData,
  isAdmin: boolean
) {
  await request(app).post('/signup').send(data);
  const usersRepository = getRepository(User);
  await usersRepository.update(
    {
      email: data.email,
    },
    {
      verified_email: true,
      admin: isAdmin,
    }
  );
  const response = await request(app).post('/signin').send({
    email: data.email,
    password: data.password,
  });
  return response.body.token;
}

describe('FindAllOrphanagesConfirmedController Tests', () => {
  let connection: Connection;
  let accessTokenUser: string;

  beforeAll(async () => {
    const connectionOptions = await getConnectionOptions('test');
    connection = await createConnection({
      ...connectionOptions,
      name: 'default',
    });
    accessTokenUser = await createUserAndReturnAccessToken(
      {
        first_name: 'Teste 2',
        last_name: 'Teste 2',
        email: 'teste2@teste.com',
        password: 'teste1234',
        confirm_password: 'teste1234',
      },
      false
    );
  });

  beforeEach(async () => {
    jest
      .spyOn(MailtrapProvider.prototype, 'send')
      .mockImplementation(jest.fn());
    const imagesRepository = getRepository(Image);
    const orphanagesRepository = getRepository(Orphanage);
    await imagesRepository.clear();
    await orphanagesRepository.clear();
  });

  afterAll(async () => {
    const usersRepository = getRepository(User);
    await usersRepository.clear();
    await connection.close();
  });

  it('should return all orphanages', async () => {
    const orphanagesRepository = getRepository(Orphanage);
    await orphanagesRepository.insert([
      {
        name: 'Teste',
        latitude: -5.101444,
        longitude: -38.369682,
        about: 'Teste',
        whatsapp: '9999999999',
        instructions: 'Teste',
        open_from: 1020,
        open_until: 1140,
        open_on_weekends: true,
        confirmed: true,
      },
      {
        name: 'Teste 2',
        latitude: -5.096411,
        longitude: -38.368701,
        about: 'Teste 2',
        whatsapp: '9999999999',
        instructions: 'Teste',
        open_from: 540,
        open_until: 780,
        open_on_weekends: true,
        confirmed: true,
      },
      {
        name: 'Teste 3',
        latitude: -5.095159,
        longitude: -38.371198,
        about: 'Teste 3',
        whatsapp: '9999999999',
        instructions: 'Teste',
        open_from: 900,
        open_until: 1140,
        open_on_weekends: true,
        confirmed: true,
      },
    ]);
    const response = await request(app)
      .get('/orphanages')
      .set({ Authorization: `Basic ${accessTokenUser}` });

    expect(response.body.length).toBe(3);
    expect(response.body[0]).toEqual({
      about: 'Teste',
      id: 1,
      images: [],
      instructions: 'Teste',
      latitude: -5.101444,
      longitude: -38.369682,
      name: 'Teste',
      open_from: '17:00',
      open_on_weekends: true,
      open_until: '19:00',
      whatsapp: '9999999999',
    });
    expect(response.status).toBe(200);
  });
});
