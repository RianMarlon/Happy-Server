import jwt from 'jsonwebtoken';
import { resolve } from 'path';

import AppError from '../../../shared/errors/app-error';
import { IHashProvider } from '../../../shared/providers/hash/models/hash-provider.interface';
import { IMailProvider } from '../../../shared/providers/mail/models/mail-provider.interface';
import { IUsersRepository } from '../domain/repositories/users-repository.interface';

interface IRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

class CreateUserService {
  constructor(
    private usersRepository: IUsersRepository,
    private hashProvider: IHashProvider,
    private mailProvider: IMailProvider
  ) {}

  async execute(data: IRequest): Promise<void> {
    const userByEmail = await this.usersRepository.findByEmail(data.email);

    if (userByEmail) {
      throw new AppError('E-mail informado já foi cadastrado!', 400);
    }

    const passwordEncrypted = await this.hashProvider.generate(data.password);

    const newData = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email.toLowerCase(),
      password: passwordEncrypted,
    };

    const user = await this.usersRepository.create({ ...newData });
    const payload = {
      id: user.id,
    };

    const token = jwt.sign(
      { ...payload },
      process.env.AUTH_SECRET_CONFIRM_EMAIL as string
    );

    const templateMailPath = resolve(
      './src/templates/emails/auth/confirmEmail.hbs'
    );

    const to = data.email;
    const from = `Happy <${process.env.MAIL_SERVICE_EMAIL}>`;

    const variables = {
      mailUrl: process.env.MAIL_URL,
      token,
    };

    try {
      await this.mailProvider.send(
        to,
        from,
        'Confirme seu e-mail',
        variables,
        templateMailPath
      );
    } catch (error) {
      throw new AppError('Não foi possível enviar o e-mail!', 500);
    }
  }
}

export default CreateUserService;
