import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { FunctionsService } from "../functions/functions.service";
import { SchedulerRegistry } from "@nestjs/schedule";
import {CronJob} from "cron"
import { Job } from "./jobs.entity";
import { IsNull } from "typeorm";

@Injectable()
export class JobsService implements OnModuleInit{
    constructor(@InjectDataSource('default')
                private datasource: DataSource,
                private functions: FunctionsService,
                private schedulerRegistry: SchedulerRegistry) {

    }
    private readonly logger = new Logger(JobsService.name);

    async onModuleInit() {
        await this.addAllJobs()
    }

    async addAllJobs() {
        let jobs = await this.datasource.getRepository(Job).findBy({deletedAt: IsNull()})

        for(let i in jobs) {
            await this.addJob(jobs[i])

        }
    }

    async addJob(job: Job) {
        const cjob = new CronJob(job.cron, async () => {
            await  this.functionHandler(job.functionAlias)
        });
        this.schedulerRegistry.addCronJob(`${job.id}`, cjob)
        this.logger.log(`Job ${job.id} added for function ${job.functionAlias}`)
        cjob.start()
    }

    async functionHandler(alias) {
        let f = await this.functions.getByAlias(alias)
        if (!f)
            return

        await this.functions.callByAlias(alias, f.context)
    }
}
