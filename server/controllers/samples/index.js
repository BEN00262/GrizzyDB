import { nanoid } from 'nanoid';
import { SampleModel } from "../../models/index.js";
import { GrizzyLLMInstance } from "../../services/index.js";
import { massage_error, massage_response } from "../../utils/index.js";

const SUPPORTED_DIALECTS = ['mariadb', 'mysql', 'postgres'];

export class SamplesController {
    // this will be created by chagpt
    static async create_samples(req,res) {
        try {
            // call gpt to do the generation here
            const generated_data = await GrizzyLLMInstance.generate_sample_data_templates(
                SUPPORTED_DIALECTS
            );

            // verify the output

            // save the different samples
            await SampleModel.insertMany(generated_data.map(x => {
                return {
                    name: `sample-${nanoid(16)}`,
                    ...x
                }
            }));

            return massage_response({ status: true }, res);
        } catch (error) {
            return massage_error(error, res);
        }
    }

    static async generate_schema_and_data_from_user_prompt(req, res) {
        try {
            const { prompt } = req.body;

            // call gpt to do the generation here
            const generated_data = await GrizzyLLMInstance.generate_sample_data_templates(
                prompt, SUPPORTED_DIALECTS
            );

            // verify the output


            return massage_response({ generated_data }, res);
        } catch (error) {
            return massage_error(error, res);
        }
    }

    static async get_samples(req, res) {
        try {
            const samples = await SampleModel.find().lean();

            return massage_response({ samples }, res);
        } catch (error) {
            return massage_error(error, res);
        }
    }
}