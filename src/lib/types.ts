

import type { Post as PrismaPost, Review as PrismaReview, Subtitle as PrismaSubtitle, User as PrismaUser, FavoritePost as PrismaFavoritePost, Episode, MetaData, Series as PrismaSeries, Group as PrismaGroup, GroupMember as PrismaGroupMember } from "@prisma/client";

export enum PostType {
  MOVIE = 'MOVIE',
  TV_SERIES = 'TV_SERIES',
  OTHER = 'OTHER',
}

export type User = PrismaUser;

export type Review = Omit<PrismaReview, 'parentId'> & {
  user: User;
  replies?: Review[];
  parentId?: number | null;
};

export type Subtitle = Omit<PrismaSubtitle, 'authorizedUsers'> & {
  uploaderName: string;
};

export type MediaLink = {
  id: number;
  type: 'trailer' | 'image';
  url: string;
}

export type Post = Omit<PrismaPost, 'mediaLinks' | 'genres' | 'subtitles'> & {
  genres: string[];
  mediaLinks: MediaLink[];
  reviews: Review[];
  subtitles: Subtitle[];
  author: User;
  series?: Series | null;
  favoritePosts?: PrismaFavoritePost[];
  likedBy?: User[];
  dislikedBy?: User[];
  episodes?: Episode[];
  metaData?: MetaData[];
   _count?: {
    likedBy: number;
    reviews: number;
  };
};

export type Series = Omit<PrismaSeries, 'posts'> & {
  posts: Post[];
  _count?: {
    posts: number;
  }
}

export type PostFormData = Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'reviews' | 'subtitles' | 'author' | 'authorId' | 'mediaLinks' | 'favoritePosts' | 'likedBy' | 'dislikedBy' | 'genres' | 'episodes' | 'metaData' | 'series' | '_count'> & {
  mediaLinks?: Omit<MediaLink, 'id'>[];
  genres?: string[];
  seriesId?: number | null;
  groupId?: string | null;
};


// Group Management Types
export type MemberWithUser = PrismaGroupMember & { user: User };

export type GroupWithMembers = PrismaGroup & {
  members: MemberWithUser[];
};

export type GroupWithCount = PrismaGroup & {
  _count: {
    members: number;
    pendingRequests: number;
  };
};

export type GroupForProfile = PrismaGroup & {
    posts: Post[];
    isMember: boolean;
    membershipStatus: 'ACTIVE' | 'PENDING' | null;
    _count: {
        members: number;
    };
    members: { user: Pick<User, 'id' | 'name' | 'image'> }[];
    createdBy: Pick<User, 'id' | 'name' | 'image'> | null;
};

export type GroupForEditing = Pick<PrismaGroup, 'id' | 'name' | 'description' | 'profilePhoto' | 'coverPhoto'> & {
  createdById: string | null;
};
