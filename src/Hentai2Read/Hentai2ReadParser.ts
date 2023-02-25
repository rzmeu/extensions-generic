import {
    MangaTile
} from 'paperback-extensions-common'
import {CheerioAPI} from 'cheerio/lib/cheerio';


export class Hentai2ReadParser {
    cheerio: CheerioAPI;
    domain: string

    constructor(cheerio: CheerioAPI, domain: string) {
        this.cheerio = cheerio
        this.domain = domain
    }

    parseMangaItems = (data: string): MangaTile[] => {
        const mangaTiles: MangaTile[] = []
        const $ = this.cheerio.load(data)

        const items = $('div.row.book-grid > div.col-xs-6.col-sm-4.col-md-3.col-xl-2').toArray()

        for(const obj of $('div.row.book-grid > div.col-xs-6.col-sm-4.col-md-3.col-xl-2').toArray()) {
            const id = $('a.title', obj).attr('href')!.replace(this.domain, '').replaceAll('/', '')
            const image = $('picture>img', obj).attr('data-src')!.replace('/cdn-cgi/image/format=auto/', '')
            const title = $('a.title > span.title-text', obj).text()

            mangaTiles.push(createMangaTile({
                id: id,
                image: image,
                title: createIconText({ text: title })
            }))
        }

        return mangaTiles
    }
}