import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { DataIndexJob } from "./data-indexer.dto";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { DataIndexer } from "./data-indexer";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";


@Processor({
    name: 'datasource-data-indexing',
}, {
    concurrency: 1
})
export class IndexerConsumer extends WorkerHost {
    constructor(@InjectDataSource('default')
                private datasource: DataSource,
                //@InjectQueue('datasource-data-indexing') private dataIndexingQueue: Queue,
                private configService: ConfigService) {
        super()
        this.indexer = new DataIndexer(configService, datasource)
    }
    private readonly logger = new Logger(IndexerConsumer.name);
    private indexer:DataIndexer = null

    async process(job: Job<DataIndexJob, any, string>): Promise<any> {
        await this.indexer.dataReindex({
                dataSourceConfig: job.data.datasource,
                ids: job.data.ids
            },
            job.data.context)

        return true
    }

    @OnWorkerEvent('error')
    onError(error: Error) {
        this.logger.error(error)
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job, error: Error) {
        this.logger.error(`Job ${job.id} failed: ${error.message}`, error)
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job) {
        this.logger.log(`Job ${job.id} completed`)
    }

    @OnWorkerEvent('active')
    onStart(job: Job) {
        this.logger.log(`Job ${job.id} has started`, job)
    }

}


