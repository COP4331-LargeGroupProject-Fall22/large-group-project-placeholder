import * as dotenv from 'dotenv';
dotenv.config();

import UserDatabase from '../../database/UserDatabase';
import { NextFunction, Request, Response } from 'express';
import supertest from 'supertest';

let mockUser: IUser = {
    inventory: [],
    firstName: 'Mikhail',
    lastName: 'Plekunov',
    lastSeen: Date.now(),
    password: '123',
    username: 'Mekromic'
};

let mockServerUser: IIdentification = {
    username: mockUser.username
};

let mockUpdatedUser: IUser = {
    inventory: mockUser.inventory,
    firstName: "Alex",
    lastName: "Alex",
    lastSeen: 123123123,
    password: '123321123321',
    username: 'Marta'
};

jest.mock('../../serverAPI/middleware/authentication/JWTAuthenticator', () => {
    return function () {
        return {
            authenticate: () => (req: Request, res: Response, next: NextFunction) => {
                (req as any).serverUser = mockServerUser; 
                next(); 
            }            
        };
    }
});

jest.mock('../../serverAPI/middleware/logger/Logger', () => {
    return {
        consoleLog: (req: Request, res: Response, next: NextFunction) => { next(); }
    };
});

let databaseURL = (global as any).__MONGO_URI__;
let databaseName = process.env.DB_NAME!;
let collectionName = process.env.DB_USERS_COLLECTION!;

UserDatabase.connect(databaseURL, databaseName, collectionName);

import { app } from '../../App';
import IBaseUser from '../../serverAPI/model/user/IBaseUser';
import IUser from '../../serverAPI/model/user/IUser';
import IIdentification from '../../serverAPI/model/user/IIdentification';



describe('User endpoints', () => {
    let mockBaseUser: IBaseUser;

    beforeAll(() => {
        mockBaseUser = {
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            lastSeen: mockUser.lastSeen
        };
    });

    describe('Get User Requests', () => {
        it(`Get User with supported id (user doesn't exist)`, async () => {
            let response = await supertest(app).get(`/user`);

            expect(response.statusCode).toBe(404);
            expect(response.body.data).toBe(undefined);
        });

        it(`Get User with supported id (user exist)`, async () => {
            await UserDatabase.getInstance()?.Create(mockUser);

            let response = await supertest(app).get(`/user`);

            expect(response.statusCode).toBe(200);
        });
    });

    describe('Update User Requests', () => {
        it('Update User with supported id (user exists)', async () => {
            let response = await supertest(app)
                .put(`/user`)
                .send(`firstName=${mockUpdatedUser.firstName}`)
                .send(`lastName=${mockUpdatedUser.lastName}`);

            expect(response.statusCode).toBe(200);
        });
    });

    describe('Delete User Requests', () => {
        it('Delete User with supported id (user exists)', async () => {
            let response = await supertest(app)
                .delete(`/user`);

            expect(response.statusCode).toBe(200);
        });
    });
});

afterAll(async () => {
    UserDatabase.getInstance()?.disconnect();
});
