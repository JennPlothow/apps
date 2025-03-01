import React, { ReactElement, useContext, useEffect } from 'react';
import { Button } from '@dailydotdev/shared/src/components/buttons/Button';
import UpvoteIcon from '@dailydotdev/shared/src/components/icons/Upvote';
import CommentIcon from '@dailydotdev/shared/src/components/icons/Discuss';
import MenuIcon from '@dailydotdev/shared/src/components/icons/Menu';
import ShareIcon from '@dailydotdev/shared/src/components/icons/Share';
import SimpleTooltip from '@dailydotdev/shared/src/components/tooltips/SimpleTooltip';
import BookmarkIcon from '@dailydotdev/shared/src/components/icons/Bookmark';
import Modal from 'react-modal';
import { useContextMenu } from '@dailydotdev/react-contexify';
import { isTesting } from '@dailydotdev/shared/src/lib/constants';
import { PostBootData } from '@dailydotdev/shared/src/lib/boot';
import { AnalyticsEvent, Origin } from '@dailydotdev/shared/src/lib/analytics';
import AuthContext from '@dailydotdev/shared/src/contexts/AuthContext';
import usePersistentContext from '@dailydotdev/shared/src/hooks/usePersistentContext';
import AnalyticsContext from '@dailydotdev/shared/src/contexts/AnalyticsContext';
import { postAnalyticsEvent } from '@dailydotdev/shared/src/lib/feed';
import { useKeyboardNavigation } from '@dailydotdev/shared/src/hooks/useKeyboardNavigation';
import { useSharePost } from '@dailydotdev/shared/src/hooks/useSharePost';
import ShareModal from '@dailydotdev/shared/src/components/modals/ShareModal';
import { LazyModal } from '@dailydotdev/shared/src/components/modals/common/types';
import { useLazyModal } from '@dailydotdev/shared/src/hooks/useLazyModal';
import CreateSharedPostModal, {
  CreateSharedPostModalProps,
} from '@dailydotdev/shared/src/components/modals/post/CreateSharedPostModal';
import { mutationHandlers } from '@dailydotdev/shared/src/hooks';
import CompanionContextMenu from './CompanionContextMenu';
import '@dailydotdev/shared/src/styles/globals.css';
import { getCompanionWrapper } from './common';
import useCompanionActions from './useCompanionActions';
import CompanionToggle from './CompanionToggle';

if (!isTesting) {
  Modal.setAppElement('daily-companion-app');
}

type CompanionMenuProps = {
  post: PostBootData;
  companionHelper: boolean;
  setPost: (T) => void;
  companionState: boolean;
  onOptOut: () => void;
  setCompanionState: (T) => void;
  onOpenComments?: () => void;
};

export default function CompanionMenu({
  post,
  companionHelper,
  setPost,
  companionState,
  onOptOut,
  setCompanionState,
}: CompanionMenuProps): ReactElement {
  const { modal, closeModal } = useLazyModal();
  const { trackEvent } = useContext(AnalyticsContext);
  const { user } = useContext(AuthContext);
  const [showCompanionHelper, setShowCompanionHelper] = usePersistentContext(
    'companion_helper',
    companionHelper,
  );
  const updatePost = async ({ update, event }) => {
    const oldPost = post;
    setPost({
      ...post,
      ...update,
    });
    trackEvent(
      postAnalyticsEvent(event, post, {
        extra: { origin: Origin.CompanionContextMenu },
      }),
    );
    return () => setPost(oldPost);
  };
  const { sharePost, openSharePost, closeSharePost } = useSharePost(
    Origin.Companion,
  );
  const {
    bookmark,
    removeBookmark,
    upvotePost,
    cancelPostUpvote,
    downvotePost,
    cancelPostDownvote,
    blockSource,
    disableCompanion,
    removeCompanionHelper,
    toggleCompanionExpanded,
  } = useCompanionActions({
    onBookmarkMutate: () =>
      updatePost({
        update: { bookmarked: true },
        event: AnalyticsEvent.BookmarkPost,
      }),
    onRemoveBookmarkMutate: () =>
      updatePost({
        update: { bookmarked: false },
        event: AnalyticsEvent.RemovePostBookmark,
      }),
    onUpvotePostMutate: () =>
      updatePost({
        update: mutationHandlers.upvote(post),
        event: AnalyticsEvent.UpvotePost,
      }),
    onCancelPostUpvoteMutate: () =>
      updatePost({
        update: mutationHandlers.cancelUpvote(post),
        event: AnalyticsEvent.RemovePostUpvote,
      }),
    onDownvotePostMutate: () =>
      updatePost({
        update: mutationHandlers.downvote(post),
        event: AnalyticsEvent.DownvotePost,
      }),
    onCancelPostDownvoteMutate: () =>
      updatePost({
        update: mutationHandlers.cancelDownvote(post),
        event: AnalyticsEvent.RemovePostDownvote,
      }),
  });

  /**
   * Use a cleanup effect to always set the local cache helper state to false on destroy
   */
  useEffect(() => {
    if (user) {
      removeCompanionHelper({});
    }
    const cleanup = () => {
      setShowCompanionHelper(false);
    };
    window.addEventListener('beforeunload', cleanup);
    return () => cleanup();
    // @NOTE see https://dailydotdev.atlassian.net/l/cp/dK9h1zoM
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCompanion = () => {
    setShowCompanionHelper(false);
    trackEvent({
      event_name: `${companionState ? 'close' : 'open'} companion`,
    });
    toggleCompanionExpanded({ companionExpandedValue: !companionState });
    setCompanionState((state) => !state);
  };

  const onShare = () => openSharePost(post);

  const optOut = () => {
    disableCompanion({});
    onOptOut();
  };

  const toggleUpvote = async () => {
    if (user) {
      if (!post.upvoted) {
        await upvotePost({ id: post.id });
      } else {
        await cancelPostUpvote({ id: post.id });
      }
    } else {
      window.open(
        `${process.env.NEXT_PUBLIC_WEBAPP_URL}signup?close=true`,
        '_blank',
      );
    }
  };

  const toggleDownvote = async () => {
    if (user) {
      if (!post.downvoted) {
        await downvotePost({ id: post.id });
      } else {
        await cancelPostDownvote({ id: post.id });
      }
    } else {
      window.open(
        `${process.env.NEXT_PUBLIC_WEBAPP_URL}signup?close=true`,
        '_blank',
      );
    }
  };

  const toggleBookmark = async () => {
    if (user) {
      if (!post.bookmarked) {
        await bookmark({ id: post.id });
      } else {
        await removeBookmark({ id: post.id });
      }
    } else {
      window.open(
        `${process.env.NEXT_PUBLIC_WEBAPP_URL}signup?close=true`,
        '_blank',
      );
    }
  };

  const { show: showCompanionOptionsMenu } = useContextMenu({
    id: 'companion-options-context',
  });
  const onContextOptions = (event: React.MouseEvent): void => {
    showCompanionOptionsMenu(event, {
      position: { x: 48, y: 318 },
    });
  };

  const tooltipContainerProps = { className: 'shadow-2 whitespace-nowrap' };

  const onEscape = () => {
    if (!companionState) {
      return;
    }

    trackEvent({ event_name: 'close companion' });
    toggleCompanionExpanded({ companionExpandedValue: false });
    setCompanionState(false);
  };

  useKeyboardNavigation(window, [['Escape', onEscape]], {
    disabledModalOpened: true,
  });

  return (
    <div className="group flex relative flex-col gap-2 self-center p-2 my-6 w-14 rounded-l-16 border border-theme-divider-quaternary bg-theme-bg-primary">
      <CompanionToggle
        companionState={companionState}
        isAlertDisabled={!showCompanionHelper}
        tooltipContainerProps={tooltipContainerProps}
        onToggleCompanion={toggleCompanion}
      />
      <SimpleTooltip
        placement="left"
        content={post?.upvoted ? 'Remove upvote' : 'Upvote'}
        appendTo="parent"
        container={tooltipContainerProps}
      >
        <Button
          icon={<UpvoteIcon secondary={post?.upvoted} />}
          pressed={post?.upvoted}
          onClick={toggleUpvote}
          className="btn-tertiary-avocado"
        />
      </SimpleTooltip>
      <SimpleTooltip
        placement="left"
        content="Add comment"
        appendTo="parent"
        container={tooltipContainerProps}
      >
        <Button
          className="btn-tertiary-blueCheese"
          pressed={post?.commented}
          icon={<CommentIcon />}
          onClick={() => setCompanionState(true)}
        />
      </SimpleTooltip>
      <SimpleTooltip
        placement="left"
        content={`${post?.bookmarked ? 'Remove from' : 'Save to'} bookmarks`}
        appendTo="parent"
        container={tooltipContainerProps}
      >
        <Button
          icon={<BookmarkIcon secondary={post?.bookmarked} />}
          pressed={post?.bookmarked}
          onClick={toggleBookmark}
          className="btn-tertiary-bun"
        />
      </SimpleTooltip>
      <SimpleTooltip
        placement="left"
        content="Share post"
        appendTo="parent"
        container={tooltipContainerProps}
      >
        <Button
          className="btn-tertiary-cabbage"
          onClick={onShare}
          icon={<ShareIcon />}
        />
      </SimpleTooltip>
      <SimpleTooltip
        placement="left"
        content="More options"
        appendTo="parent"
        container={tooltipContainerProps}
      >
        <Button
          className="btn-tertiary"
          icon={<MenuIcon />}
          onClick={onContextOptions}
        />
      </SimpleTooltip>
      <CompanionContextMenu
        onShare={onShare}
        postData={post}
        onBlockSource={blockSource}
        onDisableCompanion={optOut}
        onDownvote={toggleDownvote}
      />
      {sharePost && (
        <ShareModal
          isOpen={!!sharePost}
          parentSelector={getCompanionWrapper}
          post={sharePost}
          origin={Origin.Companion}
          onRequestClose={closeSharePost}
        />
      )}
      {modal?.type === LazyModal.CreateSharedPost && (
        <CreateSharedPostModal
          isOpen
          parentSelector={getCompanionWrapper}
          onRequestClose={closeModal}
          {...(modal.props as CreateSharedPostModalProps)}
        />
      )}
    </div>
  );
}
