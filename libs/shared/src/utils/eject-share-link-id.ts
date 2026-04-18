export const getShareId = (share_link: string): string => {
  return share_link.split('/')[4];
};
