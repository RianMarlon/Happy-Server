import { Router, Request, Response } from 'express';
import multer from 'multer';

import AuthController from './controllers/AuthController';
import authenticate from './middlewares/auth';
import authenticateAdmin from './middlewares/authAdmin';

import FindAllOrphanagesController from './modules/orphanages/infra/http/controllers/find-all-orphanages-controller';
import FindAllOrphanagesConfirmedController from './modules/orphanages/infra/http/controllers/find-all-orphanages-confirmed-controller';
import FindAllOrphanagesPendingController from './modules/orphanages/infra/http/controllers/find-all-orphanages-pending-controller';
import ShowOrphanageController from './modules/orphanages/infra/http/controllers/show-orphanage-controller';
import CreateOrphanageController from './modules/orphanages/infra/http/controllers/create-orphanage-controller';
import UpdateOrphanageController from './modules/orphanages/infra/http/controllers/update-orphanage-controller';
import DeleteOrphanageController from './modules/orphanages/infra/http/controllers/delete-orphanage-controller';
import ConfirmOrphanageController from './modules/orphanages/infra/http/controllers/confirm-orphanage-controller';

import CreateUserController from './modules/users/infra/http/create-user-controller';

import SigninController from './modules/auth/infra/http/signin-controller';
import ConfirmEmailController from './modules/auth/infra/http/confirm-email-controller';

import uploadConfig from './config/upload';

const routes = Router();
const upload = multer(uploadConfig);

const findAllOrphanagesController = new FindAllOrphanagesController();
const findAllOrphanagesConfirmedController =
  new FindAllOrphanagesConfirmedController();
const findAllOrphanagesPendingController =
  new FindAllOrphanagesPendingController();
const showOrphanageController = new ShowOrphanageController();
const createOrphanageController = new CreateOrphanageController();
const updateOrphanageController = new UpdateOrphanageController();
const confirmOrphanageController = new ConfirmOrphanageController();
const deleteOrphanageController = new DeleteOrphanageController();

const createUserController = new CreateUserController();

const signinController = new SigninController();
const confirmEmailController = new ConfirmEmailController();

routes.post('/signup', createUserController.handleRequest);
routes.post('/signin', signinController.handleRequest);
routes.put('/confirm-email', confirmEmailController.handleRequest);

routes.post('/forgot-password', AuthController.forgotPassword);
routes.put('/change-password', AuthController.changePassword);
routes.post('/validate-token', AuthController.validateToken);

routes.get(
  '/orphanages',
  authenticate,
  findAllOrphanagesController.handleRequest
);
routes.post(
  '/orphanages',
  authenticate,
  upload.array('images'),
  createOrphanageController.handleRequest
);
routes.get(
  '/orphanages/:id',
  authenticate,
  showOrphanageController.handleRequest
);

routes.put(
  '/orphanages/:id',
  authenticateAdmin,
  upload.array('images'),
  updateOrphanageController.handleRequest
);
routes.delete(
  '/orphanages/:id',
  authenticateAdmin,
  deleteOrphanageController.handleRequest
);

routes.get(
  '/orphanages-confirmed',
  authenticateAdmin,
  findAllOrphanagesConfirmedController.handleRequest
);
routes.get(
  '/orphanages-pending',
  authenticateAdmin,
  findAllOrphanagesPendingController.handleRequest
);

routes.put(
  '/orphanages/:id/confirm',
  authenticateAdmin,
  confirmOrphanageController.handleRequest
);

routes.get('/status', (request: Request, response: Response) => {
  return response.status(200).json();
});

export default routes;
