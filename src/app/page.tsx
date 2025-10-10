
'use server';

import { getPosts, getUsers, getPublicGroups } from '@/lib/actions';
import HomePageClient from '@/components/home-page-client';
import { MyReusableButton } from '@/components/my-reusable-button'; // Import a custom button
import { Mail } from 'lucide-react';

export default async function HomePage({ searchParams }: { searchParams?: { timeFilter?: string, page?: string, sortBy?: string, type?: string } }) {
  const timeFilter = searchParams?.timeFilter;
  const sortBy = searchParams?.sortBy;
  const typeFilter = searchParams?.type;
  const currentPage = Number(searchParams?.page) || 1;

  const { posts, totalPages } = await getPosts({ page: currentPage, limit: 10, filters: { timeFilter, sortBy, type: typeFilter } });
  const users = await getUsers();
  const groups = await getPublicGroups(5);
  
  return (
    <>
      <HomePageClient
        initialPosts={posts}
        initialUsers={users}
        initialGroups={groups as any}
        totalPages={totalPages}
        currentPage={currentPage}
        searchParams={searchParams}
      />
      {/* 
        මෙන්න, අප, විසින්, නිර්මාණය, කළ, reusable, button, එක, භාවිතා, කරන, ආකාරය.
        ShadCN, component, එකක්, භාවිතා, කරනවා, වගේමයි.
      */}
      <div className="p-8 flex justify-center items-center gap-4">
        <MyReusableButton variant="default" size="lg">
          <Mail className="mr-2 h-5 w-5" />
          Reusable Default
        </MyReusableButton>
        <MyReusableButton variant="outline" size="lg">
          <Mail className="mr-2 h-5 w-5" />
          Reusable Outline
        </MyReusableButton>
         <MyReusableButton variant="destructive" size="lg">
          <Mail className="mr-2 h-5 w-5" />
          Reusable Destructive
        </MyReusableButton>
      </div>
    </>
  );
}
