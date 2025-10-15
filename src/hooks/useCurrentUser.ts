
"use client";

import { useSession } from "next-auth/react";

export const useCurrentUser = () => {
  const { data: session } = useSession();
  
  if (session?.user) {
    // console.log("පරිශීලක දත්ත (Hook): දත්ත තිබේ. ->", session.user);
  } else {
    // console.log("පරිශීලක දත්ත (Hook): දත්ත නොමැත (null).");
  }
  
  return session?.user;
};
