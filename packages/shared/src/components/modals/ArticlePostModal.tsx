import React, { ReactElement, useContext } from 'react';
import { Modal, ModalProps, modalSizeToClassName } from './common/Modal';
import {
  ONBOARDING_OFFSET,
  PassedPostNavigationProps,
  PostContent,
} from '../post/PostContent';
import { Origin } from '../../lib/analytics';
import usePostNavigationPosition from '../../hooks/usePostNavigationPosition';
import usePostById from '../../hooks/usePostById';
import BasePostModal from './BasePostModal';
import OnboardingContext from '../../contexts/OnboardingContext';
import { PostType } from '../../graphql/posts';
import { PostAnalyticsProps } from '../post/common';

interface ArticlePostModalProps
  extends ModalProps,
    PassedPostNavigationProps,
    PostAnalyticsProps {
  id: string;
}

export default function ArticlePostModal({
  id,
  className,
  onRequestClose,
  onPreviousPost,
  onNextPost,
  postPosition,
  onRemovePost,
  getFeedAnalytics,
  ...props
}: ArticlePostModalProps): ReactElement {
  const { showArticleOnboarding } = useContext(OnboardingContext);
  const { post, isPostLoadingOrFetching } = usePostById({ id });
  const position = usePostNavigationPosition({
    isLoading: isPostLoadingOrFetching,
    isDisplayed: props.isOpen,
    offset: showArticleOnboarding ? ONBOARDING_OFFSET : 0,
  });

  return (
    <BasePostModal
      {...props}
      onRequestClose={onRequestClose}
      postType={PostType.Article}
      isLoading={isPostLoadingOrFetching}
    >
      <PostContent
        position={position}
        post={post}
        postPosition={postPosition}
        onPreviousPost={onPreviousPost}
        onNextPost={onNextPost}
        inlineActions
        className={{
          onboarding: 'mt-8',
          navigation: { actions: 'tablet:hidden ml-auto' },
          fixedNavigation: {
            container: modalSizeToClassName[Modal.Size.XLarge],
            actions: 'ml-auto',
          },
        }}
        getFeedAnalytics={getFeedAnalytics}
        onClose={onRequestClose}
        origin={Origin.ArticleModal}
        onRemovePost={onRemovePost}
      />
    </BasePostModal>
  );
}
