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

    parser = new Hentai2ReadParser()

    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 15000,
        interceptor: {
            interceptRequest: async (request: Request): Promise<Request> => {
                request.headers = {
                    ...(request.headers ?? {}),
                    'referer': `${DOMAIN}/`,
                    'user-agent': this.userAgent ?? request.headers?.['user-agent']
                }

                return request
            },

            interceptResponse: async (response: Response): Promise<Response> => {
                return response
            }
        }
    });

    override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const section1 = createHomeSection({id: 'latest', title: 'Latest', view_more: true, type: HomeSectionType.singleRowLarge})
        const section2 = createHomeSection({id: 'popular', title: 'Popular', view_more: true, type: HomeSectionType.singleRowLarge})
        const section3 = createHomeSection({id: 'trending', title: 'Trending', view_more: true, type: HomeSectionType.singleRowLarge})
        const section4 = createHomeSection({id: 'top-rated', title: 'Top Rated', view_more: true, type: HomeSectionType.singleRowLarge})
        const section5 = createHomeSection({id: 'milfs', title: 'Milfs', view_more: true, type: HomeSectionType.singleRowLarge})
        const sections = [section1, section2, section3, section4, section5]

        for(const section of sections) {
            const sectionPagedResult = await this.getViewMoreItems(section.id, {nextPage: 1})
            section.items = sectionPagedResult?.results
            sectionCallback(section)
        }
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
            results: this.parser.parseMangaItems(this.cheerio.load(response.data)),
            metadata: {nextPage: page + 1}
        })
    }

    getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        return Promise.resolve(undefined)
    }

    getChapters(mangaId: string): Promise<Chapter[]> {
        return Promise.resolve([])
    }

    getMangaDetails(mangaId: string): Promise<Manga> {
        return Promise.resolve(undefined)
    }

    getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        return Promise.resolve(undefined)
    }

    searchRequest(query: SearchRequest, metadata: any): Promise<PagedResults> {
        throw new Error('Method not implemented.');
    }

    CloudFlareError(status: any) {
        if (status == 503) {
            throw new Error('CLOUDFLARE BYPASS ERROR:\nPlease go to Settings > Sources > <The name of this source> and press Cloudflare Bypass')
        }
    }
}