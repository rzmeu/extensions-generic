import {
    ContentRating,
    LanguageCode,
    SourceInfo,
    TagType
} from 'paperback-extensions-common'
import {
    getExportVersion,
    Madara
} from '../Madara'


const DOMAIN = 'https://manga18h.com'

export const Manga18hInfo: SourceInfo = {
    version: getExportVersion('0.0.0'),
    name: 'Manga18h',
    description: `Extension that pulls manga from ${DOMAIN}`,
    author: 'rzmeu',
    authorWebsite: 'http://github.com/TheNetsky',
    icon: 'icon.png',
    contentRating: ContentRating.ADULT,
    websiteBaseURL: DOMAIN,
    sourceTags: [
        {
            text: 'Notifications',
            type: TagType.GREEN
        }
    ]
}

export class Manga18h extends Madara {

    baseUrl: string = DOMAIN

    languageCode: LanguageCode = LanguageCode.ENGLISH

    override alternativeChapterAjaxEndpoint = true
    
    override hasAdvancedSearchPage = true
}