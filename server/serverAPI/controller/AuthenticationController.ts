import { Request, Response } from "express";
import IUserDatabase from "../../database/IUserDatabase";
import ResponseFormatter from "../../utils/ResponseFormatter";
import { ResponseTypes } from "../../utils/ResponseTypes";
import { Validator } from "../../utils/Validator";
import UserSchema from "../model/user/UserSchema";

/**
 * This class creates several properties responsible for authentication actions 
 * provided to the user.
 */
export default class AuthenticationController {
    private database: IUserDatabase;

    constructor(database: IUserDatabase) {
        this.database = database;
    }

    /**
     * This property is a handler that is used for "login" action of the user.
     * User will only be able to login if request body contains UID of the user.
     * Upon successful login operation, this handler will redirect user to the /api/user route.
     * 
     * @param req Request parameter that holds information about request
     * @param res Response parameter that holds information about response
     */
    login = async (req: Request, res: Response) => {
        if (req.uid === undefined) {
            res.status(400).json(ResponseFormatter.formatAsJSON(ResponseTypes.ERROR, "UID hasn't been found."));
            return;
        }

        let parameters = new Map([
            ["uid", req.uid]
        ]);

        let user = await this.database.GetUser(parameters);

        if (user === null) {
            res.status(400).json(ResponseFormatter.formatAsJSON(ResponseTypes.ERROR, `User doesn't exists.`));
            return;
        }

        // Workaround has yet to be found
        res.redirect(302, `/user/${(user as any)._id}`);
    }

    /**
     * This property is a handler that is used for "register" action of the user.
     * User will only be able to register if request body contains UID of the user and no user with the same UID is already existing in the database.
     * Upon successful register operation, this handler will return full information about registered user. 
     * 
     * @param req Request parameter that holds information about request
     * @param res Response parameter that holds information about response
     */
    register = async (req: Request, res: Response) => {
        if (req.uid === undefined) {
            res.status(400).json(ResponseFormatter.formatAsJSON(ResponseTypes.ERROR, "UID hasn't been found."));
            return;
        }

        let parameters = new Map([
            ["uid", req.uid]
        ]);

        const newUser =
            new UserSchema(
                req.body?.firstName,
                req.body?.lastName,
                req.uid
            );

        const validator = new Validator();

        let logs = await validator.validate(newUser);

        if (logs.length > 0) {
            res.status(400).json(ResponseFormatter.formatAsJSON(ResponseTypes.ERROR, logs));
            return;
        }

        let user = await this.database.GetUser(parameters);

        if (user !== null) {
            res.status(400).json(ResponseFormatter.formatAsJSON(ResponseTypes.ERROR, `User with such UID already exists.`));
            return;
        }

        let createdUser = await this.database.CreateUser(newUser);

        if (createdUser === null) {
            res.status(400).json(ResponseFormatter.formatAsJSON(ResponseTypes.ERROR));
            return;
        }

        res.status(200).json(ResponseFormatter.formatAsJSON(ResponseTypes.SUCCESS, createdUser));
    }
}
