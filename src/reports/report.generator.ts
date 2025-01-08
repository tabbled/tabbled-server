import axios from "axios";

export class ReportRenderParams{
    template: string
    data: any
    output: 'pdf' | 'xlsx'
    settings: any
}

export class ReportGenerator {
    constructor() {}

    async render(params: ReportRenderParams) {
        try {
            let res = await axios.post(process.env.REPORTS_SERVICE_URL + '/v1/render', params)
            return res.data
        } catch (e) {
            console.error(e)
            let err = e.response?.data?.message || 'unknown'
            throw "Error while rendering report: " + err
        }
    }
}