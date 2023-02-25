import {
    MangaTile
} from 'paperback-extensions-common'

export class Hentai2ReadParser {
    parseMangaItems = (result: any): MangaTile[] => {
        const mangaTiles: MangaTile[] = []

        for(let i = 0; i < result.data.length; i++) {
            mangaTiles.push(createMangaTile({
                id: result.data[i].slug,
                image: result.data[i].preview.sizes.small_thumb,
                title: createIconText({ text: result.data[i].title })
            }))
        }

        return mangaTiles
    }
}