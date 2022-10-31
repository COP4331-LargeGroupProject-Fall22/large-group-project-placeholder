import { Request, Response } from "express";
import IDatabase from '../../database/IDatabase';
import ResponseFormatter from "../../utils/ResponseFormatter";
import { ResponseTypes } from "../../utils/ResponseTypes";
import IUser from "../model/user/IUser";
import UserSchema from "../model/user/requestSchema/UserSchema";
import BaseUserController from "./BaseUserController";

/**
 * This class creates several properties responsible for user-actions 
 * provided to the user.
 */
export default class UserController extends BaseUserController {
    constructor(database: IDatabase<IUser>) {
        super(database);
    }

    protected async getUserFromRequest(req: Request, res: Response, user: IUser): Promise<IUser> {
        let userSchema = new UserSchema(
            req.body.firstName === undefined ? user.firstName : req.body.firstName,
            req.body.lastName === undefined ? user.lastName : req.body.lastName,
            req.body.username === undefined ? user.username : req.body.username,
            req.body.password === undefined ? user.password : req.body.password,
            user.lastSeen,
        );

        let logs = await userSchema.validate();

        if (logs.length > 0) {
            return Promise.reject(res.status(400)
                .json(ResponseFormatter.formatAsJSON(ResponseTypes.ERROR, logs)));
        }

        let newUser: IUser = {
            inventory: user.inventory,
            firstName: user.firstName,
            lastName: user.lastName,
            lastSeen: user.lastSeen,
            password: user.password,
            username: user.username
        };

        return Promise.resolve(newUser);
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
            return res.status(200)
                .json(ResponseFormatter.formatAsJSON(ResponseTypes.SUCCESS, this.convertToUserResponse(user)));
        }, (response) => response);
    }

    private async isUnique(username: string): Promise<boolean> {
        return this.database.Get(new Map([["username", username]])).then(user => {
            if (user === null) {
                return true;
            }

            return false;
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
       
        return this.requestGet(parameters, res).then(async user => {
            if (req.body.username !== undefined) {
                let result = await this.isUnique(req.body.username);

                if (!result) {
                    return res.status(400)
                        .json(ResponseFormatter.formatAsJSON(ResponseTypes.ERROR, "Username already exists."));
                }
            }

            return this.getUserFromRequest(req, res, user).then(validatedUser => {
                return this.requestUpdate(req.serverUser.username, validatedUser, res).then(updatedUser => {
                    return res.status(200)
                        .json(ResponseFormatter.formatAsJSON(ResponseTypes.SUCCESS, this.convertToUserResponse(updatedUser)));
                }, (response) => response);
            }, (response) => response);
        }, (response) => response);
    }

    /**
     * Deletes user object at specified userID.
     * 
     * @param req Request parameter that holds information about request.
     * @param res Response parameter that holds information about response.
     */
    delete = async (req: Request, res: Response) => {
        let parameters = new Map<string, any>([["username", req.serverUser.username]]);

        return this.requestGet(parameters, res).then(() => {
            return this.requestDelete(req.serverUser.username, res).then(result => {
                if (!result) {
                    return res.status(400).json(ResponseFormatter.formatAsJSON(ResponseTypes.ERROR));
                }

                return res.status(200)
                    .json(ResponseFormatter.formatAsJSON(ResponseTypes.SUCCESS));
            }, (response) => response);
        }, (response) => response);
    }
}
