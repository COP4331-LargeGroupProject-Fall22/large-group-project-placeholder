import { Request, Response } from "express";
import { ResponseCodes } from "../../utils/ResponseCodes";

import Encryptor from "../../utils/Encryptor";

import JWTStorage from "../middleware/authentication/JWTStorage";

import IDatabase from '../../database/IDatabase';
import IUser from "../model/user/IUser";

import BaseUserSchema from "../model/user/requestSchema/BaseUserSchema";

import BaseUserController from "./BaseController/BaseUserController";

/**
 * This class creates several properties responsible for user-actions 
 * provided to the user.
 */
export default class UserController extends BaseUserController {
    constructor(database: IDatabase<IUser>) {
        super(database);
    }

    protected async getUserFromRequest(req: Request, res: Response, user: IUser): Promise<IUser> {
        let userSchema = new BaseUserSchema(
            this.isStringUndefinedOrEmpty(req.body?.firstName) ? user.firstName : req.body.firstName,
            this.isStringUndefinedOrEmpty(req.body?.lastName) ? user.lastName : req.body.lastName,
            this.isStringUndefinedOrEmpty(req.body?.username) ? user.username : req.body.username,
            this.isStringUndefinedOrEmpty(req.body?.password) ? user.password : req.body.password,
            user.email,
            user.lastSeen,
        );

        return this.verifySchema(userSchema, res).then(userSchema => {
            let newUser: IUser = {
                inventory: user.inventory,
                shoppingList: user.shoppingList,
                firstName: userSchema.firstName,
                lastName: userSchema.lastName,
                lastSeen: user.lastSeen,
                email: user.email,
                password: userSchema.password,
                username: userSchema.username,
                allergens: user.allergens,
                isVerified: user.isVerified,
                favoriteRecipes: user.favoriteRecipes
            };

            return newUser;
        }, (response) => Promise.reject(response));
    }

    /**
     * Gets information about user at specified userID.
     *  
     * @param req Request parameter that holds information about request.
     * @param res Response parameter that holds information about response.
     */
    get = async (req: Request, res: Response) => {
        let parameters = new Map<string, any>([["username", req.serverUser.username]]);

        return this.requestGet(parameters, res).then(user => {
            return this.send(ResponseCodes.OK, res, this.convertToUserResponse(user));
        }, (response) => response);
    }

    private async isUnique(username: string): Promise<boolean> {
        return this.database.Get(new Map([["username", username]])).then(user => {
            return user === null;
        });
    }

    /**
     * Updates information of the user at specified userID.
     * 
     * @param req Request parameter that holds information about request.
     * @param res Response parameter that holds information about response.
     */
    update = async (req: Request, res: Response) => {
        let parameters = new Map<string, any>([["username", req.serverUser.username]]);

        try {
            let user = await this.requestGet(parameters, res);

            if (req.body.username !== undefined) {
                let result = await this.isUnique(req.body.username);

                if (!result) {
                    return this.send(ResponseCodes.BAD_REQUEST, res, "Username already exists.");
                }
            }

            let validatedUser = await this.getUserFromRequest(req, res, user);

            if (validatedUser.password !== user.password) {
                validatedUser.password = await new Encryptor().encrypt(validatedUser.password);
            }

            let updatedUser = await this.requestUpdate(req.serverUser.username, validatedUser, res);

            return this.send(ResponseCodes.OK, res, this.convertToUserResponse(updatedUser));
        } catch (response) {
            return response;
        }
    }

    /**
     * Deletes user object at specified userID.
     * 
     * @param req Request parameter that holds information about request.
     * @param res Response parameter that holds information about response.
     */
    delete = async (req: Request, res: Response) => {
        let parameters = new Map<string, any>([["username", req.serverUser.username]]);

        try {
            let user = await this.requestGet(parameters, res);

            let result = await this.requestDelete(req.serverUser.username, res)
            if (!result) {
                return this.send(ResponseCodes.BAD_REQUEST, res, "User could not be deleted.");
            }

            JWTStorage.getInstance().deleteJWT(user.username);
            
            return this.send(ResponseCodes.OK, res);
        } catch (response) {
            return response;
        }
    }
}
