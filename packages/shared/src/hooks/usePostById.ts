import request from 'graphql-request';
import { useMemo } from 'react';
import {
  QueryClient,
  QueryKey,
  QueryObserverOptions,
  useQuery,
  UseQueryResult,
} from 'react-query';
import { graphqlUrl } from '../lib/config';
import { useAuthContext } from '../contexts/AuthContext';
import { Post, PostData, POST_BY_ID_QUERY } from '../graphql/posts';
import { PostCommentsData } from '../graphql/comments';
import { generateQueryKey, RequestKey } from '../lib/query';

interface UsePostByIdProps {
  id: string;
  options?: QueryObserverOptions<PostData>;
}

interface UsePostById extends Pick<UseQueryResult, 'isError' | 'isFetched'> {
  post: Post;
  isPostLoadingOrFetching?: boolean;
}

const POST_KEY = 'post';

export const getPostByIdKey = (id: string): QueryKey => [POST_KEY, id];

export const updatePostCache = (
  client: QueryClient,
  id: string,
  { id: _, ...postUpdate }: Partial<Post>,
): PostData =>
  client.setQueryData<PostData>(getPostByIdKey(id), (node) => ({
    post: {
      ...node.post,
      ...postUpdate,
    },
  }));

export const removePostComments = (
  client: QueryClient,
  post: Post,
  commentId: string,
  parentId: string,
): void => {
  const key = generateQueryKey(RequestKey.PostComments, null, post.id);
  client.setQueryData<PostCommentsData>(key, (data) => {
    const copy = { ...data };

    if (commentId !== parentId) {
      const parent = copy.postComments.edges.find(
        ({ node }) => node.id === parentId,
      );
      parent.node.children.edges = parent.node.children.edges.filter(
        ({ node }) => node.id !== commentId,
      );
      updatePostCache(client, post.id, { numComments: post.numComments - 1 });
      return copy;
    }

    const parent = copy.postComments.edges.find(
      ({ node }) => node.id === commentId,
    );
    const count = parent.node.children.edges.length + 1;
    const numComments = post.numComments - count;
    updatePostCache(client, post.id, { numComments });
    copy.postComments.edges = data.postComments.edges.filter(
      ({ node }) => node.id !== commentId,
    );

    return data;
  });
};

const usePostById = ({ id, options = {} }: UsePostByIdProps): UsePostById => {
  const { tokenRefreshed } = useAuthContext();
  const key = getPostByIdKey(id);
  const {
    data: postById,
    isError,
    isFetched,
    isLoading,
    isFetching,
    isRefetching,
  } = useQuery<PostData>(
    key,
    () => request(graphqlUrl, POST_BY_ID_QUERY, { id }),
    {
      ...options,
      enabled: !!id && tokenRefreshed,
    },
  );
  const post = postById || (options?.initialData as PostData);

  return useMemo(
    () => ({
      post: post?.post,
      isError,
      isFetched,
      isPostLoadingOrFetching: (isLoading || isFetching) && !isRefetching,
    }),
    [post?.post, isError, isFetched, isLoading, isFetching, isRefetching],
  );
};

export default usePostById;
