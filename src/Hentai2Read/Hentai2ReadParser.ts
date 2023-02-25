import {
    Chapter,
    ChapterDetails,
    LanguageCode,
    Manga,
    MangaStatus,
    MangaTile,
    Tag,
    TagSection
} from 'paperback-extensions-common'
import {CheerioAPI} from 'cheerio/lib/cheerio'


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

    parseMangaDetails(data: string, mangaId: string, source: any): Manga {
        const titles: string[] = []
        const $ = this.cheerio.load(data)

        titles.push($('h3.block-title > a').text())
        //
        const image = $('div.img-container img').attr('src')
        //
        const arrayTags: Tag[] = []
        //
        const tagsParent = $('ul.list.list-simple-mini > li > b:contains(Content)').parent()

        for (const tag of $('a', tagsParent).toArray()) {
            const label = $(tag).text().trim()
            const id = encodeURI(label)

            if (!id || !label) continue
            arrayTags.push({ id: id, label: label })
        }
        const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'genres', tags: arrayTags.map(x => createTag(x)) })]

        return createManga({
            id: mangaId,
            titles: titles,
            image: image ? image : source.fallbackImage,
            status: MangaStatus.COMPLETED,
            tags: tagSections,
            desc: '',
        })
    }

    parseChapters(data: string, mangaId: string): Chapter[] {
        const $ = this.cheerio.load(data)

        const chapters: Chapter[] = []
        const langCode = LanguageCode.ENGLISH

        for(const obj of $('ul.nav-chapters > li').toArray()) {
            const chapterId = $('div.media > a', obj).attr('href')!.replace(this.domain, '').replace(mangaId, '').replaceAll('/', '')
            chapters.push(createChapter({
                id: chapterId,
                mangaId: mangaId,
                name: $('div.media > a', obj).text().replaceAll('\n', ''),
                langCode: langCode,
                chapNum: parseInt(chapterId),
                time: new Date(),
            }))
        }

        return chapters
    }

    async parseChapterDetails(data: string, mangaId: string, chapterId: string, source: any): Promise<ChapterDetails> {
        const $ = this.cheerio.load(data)
        let images = []

        for (const scriptObj of $('script').toArray()) {
            if($(scriptObj).html() != undefined && $(scriptObj).html()!.includes('gData')) {
                const gData = $(scriptObj).html()
                const gDataClean: string = gData?.replace(/[\s\S]*var gData = /, '').replace(/;/g, '').replace(/'/g, '"') || ''
                const gDataJson = JSON.parse(gDataClean)
                images = gDataJson.images.map((el: string) => `https://cdn-ngocok-static.sinxdr.workers.dev/hentai${el}`)
            }
        }

        return createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: images,
            longStrip: true
        })
    }
}