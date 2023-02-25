import {
    Chapter,
    ChapterDetails,
    ContentRating,
    HomeSection,
    HomeSectionType,
    LanguageCode,
    Manga,
    PagedResults,
    SearchRequest,
    Source,
    SourceInfo,
    TagType
} from 'paperback-extensions-common'
import {Hentai2ReadParser} from './Hentai2ReadParser'

const DOMAIN = 'https://hentai2read.com'

export const Hentai2ReadInfo: SourceInfo = {
    author: 'rzmeu',
    contentRating: ContentRating.ADULT,
    description: `Extension that pulls items from ${DOMAIN}`,
    icon: 'icon.png',
    language: LanguageCode.ENGLISH,
    name: 'Hentai2Read',
    sourceTags: [
        {
            text: '18+',
            type: TagType.YELLOW
        }
    ],
    version: '1.0',
    websiteBaseURL: 'https://github.com/rzmeu/extensions-generic'
}

export class Hentai2Read extends Source {
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.124 Safari/537.36 Edg/102.0.1245.44';

    parser = new Hentai2ReadParser(this.cheerio, DOMAIN)

    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 15000
    });

    override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const section1 = createHomeSection({id: 'latest', title: 'Latest', view_more: true, type: HomeSectionType.singleRowNormal})
        const section2 = createHomeSection({id: 'popular', title: 'Popular', view_more: true, type: HomeSectionType.singleRowNormal})
        const section3 = createHomeSection({id: 'trending', title: 'Trending', view_more: true, type: HomeSectionType.singleRowNormal})
        const section4 = createHomeSection({id: 'top-rated', title: 'Top Rated', view_more: true, type: HomeSectionType.singleRowNormal})
        const section5 = createHomeSection({id: 'milfs', title: 'Milfs', view_more: true, type: HomeSectionType.singleRowNormal})
        const sections = [section1, section2, section3, section4, section5]

        const promises: Promise<void>[] = []
        for(const section of sections) {
            sectionCallback(section)

            promises.push(
                this.getViewMoreItems(section.id, {nextPage: 1}).then(sectionPagedResult => {
                    section.items = sectionPagedResult?.results
                    sectionCallback(section)
                })
            )
        }

        // Make sure the function completes
        await Promise.all(promises)
    }

    override async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        const page: number = metadata?.nextPage || 1

        let url = ''

        switch (homepageSectionId) {
            case 'latest':
                url = `${DOMAIN}/hentai-list/all/any/all/last-added/${page}`
                break
            case 'popular':
                url = `${DOMAIN}/hentai-list/all/any/all/most-popular/${page}`
                break
            case 'trending':
                url = `${DOMAIN}/hentai-list/all/any/all/trending/${page}`
                break
            case 'top-rated':
                url = `${DOMAIN}/hentai-list/all/any/all/top-rating/${page}`
                break
            case 'milfs':
                url = `${DOMAIN}/hentai-list/category/milfs/s/last-updated/${page}`
                break
        }

        const request = createRequestObject({
            url: url,
            method: 'GET'
        })

        const response = await this.requestManager.schedule(request, 2)
        this.CloudFlareError(response.status)

        return createPagedResults({
            results: this.parser.parseMangaItems(response.data),
            metadata: {nextPage: page + 1}
        })
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: `${DOMAIN}/${mangaId}/${chapterId}`,
            method: 'GET',
        })

        const response = await this.requestManager.schedule(request, 3)
        this.CloudFlareError(response.status)
        return this.parser.parseChapterDetails(response.data, mangaId, chapterId, this)
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: `${DOMAIN}/${mangaId}`,
            method: 'GET',
        })

        const response = await this.requestManager.schedule(request, 3)
        this.CloudFlareError(response.status)
        return this.parser.parseChapters(response.data, mangaId)
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const request = createRequestObject({
            url: `${DOMAIN}/${mangaId}`,
            method: 'GET',
        })

        const response = await this.requestManager.schedule(request, 1)
        this.CloudFlareError(response.status)
        return this.parser.parseMangaDetails(response.data, mangaId, this)
    }

    getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        return Promise.prototype
    }

    override searchRequest(query: SearchRequest, metadata: any): Promise<PagedResults> {
        throw new Error('Method not implemented.')
    }

    CloudFlareError(status: any) {
        if (status == 503) {
            throw new Error('CLOUDFLARE BYPASS ERROR:\nPlease go to Settings > Sources > <The name of this source> and press Cloudflare Bypass')
        }
    }
}