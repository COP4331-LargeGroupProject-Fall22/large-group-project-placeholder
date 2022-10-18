import * as dotenv from 'dotenv';
dotenv.config();

import { UserDatabase } from '../../database/UserDatabase';
import { NextFunction, Request, Response } from 'express';
import supertest from 'supertest';

let mockUser: Partial<IUser> = {
    firstName: "Mikhail",
    lastName: "Plekunov",
    uid: "123op02osiao30kn1",
};

jest.mock('../../authentication/Authenticator', () => {
    return function () {
        return {
            authenticate: (req: Request, res: Response, next: NextFunction) => {
                if (req.headers.authorization) {
                    req.uid = mockUser.uid;
                    next();
                } else {
                    res.status(403).send();
                }
            }
        }
    }
});

jest.mock('../../logger/Logger', () => {
    return {
        consoleLog: (req: Request, res: Response, next: NextFunction) => { next(); }
    };
});

let databaseURL = (global as any).__MONGO_URI__;
let databaseName = process.env.DB_NAME;
let collectionName = process.env.DB_USERS_COLLECTION;

UserDatabase.connect(databaseURL, databaseName, collectionName);

import { app } from '../../App';
import { IUser } from '../../serverAPI/model/user/IUser';

describe('Authentication endpoints', () => {
    describe('Post Requests', () => {
        it('Register', async () => {
            let response = await supertest(app)
                .post('/auth/register')
                .set('Authorization', 'accessToken')
                .send(`firstName=${mockUser.firstName}`)
                .send(`lastName=${mockUser.lastName}`);

            let expected = await UserDatabase.getInstance()?.GetUser(new Map<string, any>([
                ["uid", mockUser.uid]
            ]));

            expect(response.statusCode).toBe(200);
            expect(expected).toMatchObject(mockUser);

            mockUser = expected as IUser;
        });
    });

    describe('Get Requests', () => {
        it('Login without uid', async () => {
            let response = await supertest(app)
                .get('/auth/login')
                .set('Authorization', 'accessToken');

            expect(response.statusCode).toBe(302);
        });
    });
});

afterAll(async () => {
    UserDatabase.getInstance()?.disconnect();
});
