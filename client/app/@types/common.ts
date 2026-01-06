export type Album = {
    id: string
    name: string
    description?: string
    thumbnailUrl?: string
    images: { id: string; url: string }[]
    numImages?: number | null
  }

  export type AlbumNoImages = {
    id: string
    name: string
    description?: string
    thumbnailUrl?: string
    numImages?: number | null
  }

export type Group = {
    description: string;
    name: string;
    dateCreated: string;
    id: string;
    lastUpdated: string;
    owner: string;
    emojiThumbnail: string;
}

export type GroupAlbums = {
    description: string;
    name: string;
    dateCreated: string;
    id: string;
    lastUpdated: string;
    owner: string;
    numImages?: number | null;
    images: { id: string; url: string }[]
    thumbnailUrl: string;
  }[]