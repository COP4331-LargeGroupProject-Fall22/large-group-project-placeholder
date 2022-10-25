import { Request, Response } from "express";
import IFoodAPI from "../../foodAPI/IFoodAPI";
import ResponseFormatter from "../../utils/ResponseFormatter";
import { ResponseTypes } from "../../utils/ResponseTypes";
import IFood from "../model/food/IFood";

/**
 * This class creates several properties responsible for authentication actions 
 * provided to the user.
 */
export default class FoodController {
    private foodAPI: IFoodAPI;

    constructor(foodAPI: IFoodAPI) {
        this.foodAPI = foodAPI;
    }

    private getException(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }

        return String(error);
    }

    /**
     * Lets client to get information about specific food defined by foodID parameter provided in the URL.
     * Upon successful operation, this handler will return full information about food. 
     * 
     * @param req Request parameter that holds information about request
     * @param res Response parameter that holds information about response
     */
    getFood = async (req: Request, res: Response) => {
        let parameters = new Map<string, any>([
            ["id", req.params.foodID]
        ]);

        let food: IFood | null;
        try {
            food = await this.foodAPI.GetFood(parameters);
        } catch (error) {
            res.status(400).json(ResponseFormatter.formatAsJSON(ResponseTypes.ERROR, this.getException(error)));
            return;
        }

        if (food === null) {
            res.status(404).json(ResponseFormatter.formatAsJSON(ResponseTypes.ERROR, "Food item hasn't been found"));
            return;
        }

        res.status(200).json(ResponseFormatter.formatAsJSON(ResponseTypes.SUCCESS, food));
    }
    /**
     * Lets client to get information about specific food defined by UPC parameter provided in the URL.
     * Upon successful operation, this handler will return full information about food. 
     * 
     * @param req Request parameter that holds information about request
     * @param res Response parameter that holds information about response
     */
    getFoodByUPC = async (req: Request, res: Response) => {
        throw new Error("Not implemented yet.");
    }

    /**
     * Lets client to search for foods using query.
     * Upon successful operation, this handler will return all foods that satisfy search query. 
     * 
     * @param req Request parameter that holds information about request
     * @param res Response parameter that holds information about response
     */
    getFoods = async (req: Request, res: Response) => {
        let parameters = new Map<string, any>();
        
        if (req.query?.query !== undefined) {
            parameters.set("query", req.query.query);
        }

        if (req.query?.size !== undefined) {
            parameters.set("number", req.query.size);
        }

        if (req.query?.intolerence !== undefined) {
            parameters.set("intolerence", req.query.intolerences);
        }

        let foods: Partial<IFood>[];
        try {
            foods = await this.foodAPI.GetFoods(parameters);
        } catch(error) {
            res.status(400).json(ResponseFormatter.formatAsJSON(ResponseTypes.ERROR, this.getException(error)));
            return;
        }
        
        res.status(200).json(ResponseFormatter.formatAsJSON(ResponseTypes.SUCCESS, foods));
    }
}
