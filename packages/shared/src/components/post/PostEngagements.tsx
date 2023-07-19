import dynamic from 'next/dynamic';
import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { Post } from '../../graphql/posts';
import { PostOrigin } from '../../hooks/analytics/useAnalyticsContextData';
import { useShareComment } from '../../hooks/useShareComment';
import { useUpvoteQuery } from '../../hooks/useUpvoteQuery';
import { AuthTriggers } from '../../lib/auth';
import { NewComment, NewCommentRef } from './NewComment';
import { PostActions, ShareBookmarkProps } from './PostActions';
import { PostComments } from './PostComments';
import { PostUpvotesCommentsCount } from './PostUpvotesCommentsCount';
import { Comment } from '../../graphql/comments';
import { AnalyticsEvent, Origin } from '../../lib/analytics';
import { useAnalyticsContext } from '../../contexts/AnalyticsContext';
import { postAnalyticsEvent } from '../../lib/feed';
import { PostAnalyticsProps } from './common';

const AuthorOnboarding = dynamic(
  () => import(/* webpackChunkName: "authorOnboarding" */ './AuthorOnboarding'),
);

const ShareNewCommentPopup = dynamic(
  () =>
    import(
      /* webpackChunkName: "shareNewCommentPopup" */ '../ShareNewCommentPopup'
    ),
  { ssr: false },
);

const ShareModal = dynamic(
  () => import(/* webpackChunkName: "shareModal" */ '../modals/ShareModal'),
);

interface PostEngagementsProps extends ShareBookmarkProps, PostAnalyticsProps {
  post: Post;
  analyticsOrigin: PostOrigin;
  shouldOnboardAuthor?: boolean;
  enableShowShareNewComment?: boolean;
}

function PostEngagements({
  post,
  onShare,
  onBookmark,
  analyticsOrigin,
  shouldOnboardAuthor,
  enableShowShareNewComment,
  getFeedAnalytics,
}: PostEngagementsProps): ReactElement {
  const postQueryKey = ['post', post.id];
  const { user, showLogin } = useAuthContext();
  const commentRef = useRef<NewCommentRef>();
  const [authorOnboarding, setAuthorOnboarding] = useState(false);
  const [permissionNotificationCommentId, setPermissionNotificationCommentId] =
    useState<string>();
  const { onShowUpvoted } = useUpvoteQuery();
  const {
    shareComment,
    showShareNewComment,
    openShareComment,
    closeShareComment,
    onShowShareNewComment,
  } = useShareComment(analyticsOrigin, enableShowShareNewComment);
  const { trackEvent } = useAnalyticsContext();

  const onCommented = (comment: Comment, isNew?: boolean) => {
    if (isNew) {
      trackEvent(
        postAnalyticsEvent(
          AnalyticsEvent.CommentPost,
          post,
          getFeedAnalytics ? getFeedAnalytics() : undefined,
        ),
      );
      setPermissionNotificationCommentId(comment.id);
      onShowShareNewComment(comment.id);
    }
  };

  useEffect(() => {
    if (shouldOnboardAuthor) {
      setAuthorOnboarding(true);
    }
  }, [shouldOnboardAuthor]);

  return (
    <>
      <PostUpvotesCommentsCount
        post={post}
        onUpvotesClick={(upvotes) => onShowUpvoted(post.id, upvotes)}
      />
      <PostActions
        onBookmark={onBookmark}
        onShare={onShare}
        post={post}
        postQueryKey={postQueryKey}
        onComment={() =>
          commentRef.current.onShowInput(Origin.PostCommentButton)
        }
        actionsClassName="hidden laptop:flex"
        origin={analyticsOrigin}
      />
      <NewComment
        className={{ container: 'my-6' }}
        post={post}
        ref={commentRef}
        onCommented={onCommented}
      />
      <PostComments
        post={post}
        origin={analyticsOrigin}
        onShare={(comment) => openShareComment(comment, post)}
        onClickUpvote={(id, count) => onShowUpvoted(id, count, 'comment')}
        permissionNotificationCommentId={permissionNotificationCommentId}
        onCommented={onCommented}
      />
      {authorOnboarding && (
        <AuthorOnboarding
          onSignUp={!user && (() => showLogin(AuthTriggers.Author))}
        />
      )}
      {showShareNewComment && (
        <ShareNewCommentPopup
          post={post}
          commentId={showShareNewComment}
          onRequestClose={() => onShowShareNewComment(null)}
        />
      )}
      {shareComment && (
        <ShareModal
          isOpen={!!shareComment}
          post={post}
          comment={shareComment}
          origin={analyticsOrigin}
          onRequestClose={closeShareComment}
        />
      )}
    </>
  );
}

export default PostEngagements;
