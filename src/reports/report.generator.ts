import * as nunjucks from "nunjucks"
import puppeteer from "puppeteer"
import * as XLSX from 'xlsx';
import {JSDOM} from "jsdom"
import * as numeral from "numeral";



export class ReportRenderParams{
    template: string
    data: any
    output: 'pdf' | 'xlsx'
    settings: any
}

export class ReportGenerator {
    constructor() {
        this.nj = nunjucks.configure({ autoescape: true });

        this.nj.addFilter('numberFormat', function(val, format) {
            return numeral(val).format(format ? format : `0.00`);
        });

        this.nj.addFilter('shorten', function(str, count) {
            return str.slice(0, count || 5);
        });
    }

    private browser = null
    private nj = null

    async render(params: ReportRenderParams) {
        console.log(params.template)
        let html = await this.nj.renderString(params.template, params.data);



        if (params.output === 'pdf') {
            return await this.toPdf(html, params.settings)
        } if (params.output === 'xlsx') {
            return await this.toXlsx(html)
        } else {
            throw `The output type ${params.output} is not implemented yet!`
        }
    }

    private async toPdf(html: string, settings: any) {
        if(!this.browser) {
            this.browser = await puppeteer.launch();
        }

        const page = await this.browser.newPage();

        await page.setContent(html, {
            waitUntil: ["load","networkidle0"]
        });

        let data = await page.pdf(settings);

        await page.close()

        return Buffer.from(data)
    }

    private async toXlsx(html) : Promise<ArrayBuffer> {
        const doc = new JSDOM(html).window.document.querySelector("table");
        const workbook = XLSX.utils.table_to_book(doc);

        return XLSX.write(workbook, {
            type: 'buffer',
            bookType: 'xlsx',
        })
    }
}