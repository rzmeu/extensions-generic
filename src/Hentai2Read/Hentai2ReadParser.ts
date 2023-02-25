import {
    Chapter, ChapterDetails, LanguageCode,
    Manga, MangaStatus,
    MangaTile, Tag, TagSection
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
            chapters.push(createChapter({
                id: mangaId,
                mangaId: mangaId,
                name: $('div.media > a', obj).text().replaceAll('\n', ''),
                langCode: langCode,
                chapNum: parseInt($('div.media > a', obj).attr('href')!.replace(this.domain, '').replace(mangaId, '').replaceAll('/', '')),
                time: new Date(),
            }))
        }

        return chapters
    }

    async parseChapterDetails(data: string, mangaId: string, chapterId: string, source: any): Promise<ChapterDetails> {
        const $ = this.cheerio.load(data)

        for (const scriptObj of $('script')) {
            if($(scriptObj).html() != null && $(scriptObj).html()!.includes('gData')) {
                const d = ''
            }
        }


        const pages: string[] = []

        const pageCount = Number($('#load_pages').attr('value'))
        const imgDir = $('#load_dir').attr('value')
        const imgId = $('#load_id').attr('value')

        if (!pageCount || isNaN(pageCount)) {
            throw new Error(`Unable to parse pageCount (found: ${pageCount}) for mangaId:${mangaId}`)
        }
        if (!imgDir) {
            throw new Error(`Unable to parse imgDir (found: ${imgDir}) for mangaId:${mangaId}`)
        }
        if (!imgId) {
            throw new Error(`Unable to parse imgId (found: ${imgId}) for mangaId:${mangaId}`)
        }

        //const domain = this.getImageSrc($('img.lazy, div.cover > img').first())
        //const subdomainRegex = domain.match(/\/\/([^.]+)/)

        // let subdomain = null
        // if (subdomainRegex && subdomainRegex[1]) subdomain = subdomainRegex[1]

        // const domainSplit = source.baseUrl.split('//')
        //
        // for (let i = 1; i < pageCount; i++) {
        //     pages.push(`${domainSplit[0]}//${subdomain}.${domainSplit[1]}/${imgDir}/${imgId}/${i}.jpg`)
        // }

        return createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: pages,
            longStrip: true
        })
    }
}