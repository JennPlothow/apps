import React from 'react';
import classed from '../../lib/classed';
import { PromptOptions } from '../../hooks/usePrompt';
import { SquadForm } from '../../graphql/squads';
import { BasePageContainer, pageBorders } from '../utilities';

export enum ModalState {
  Details = 'Squad settings',
  SelectArticle = 'Pick a post',
  WriteComment = 'Share post',
  Ready = 'Almost there!',
}
export const modalStateToScreenValue: Record<ModalState, string> = {
  [ModalState.Details]: 'squad settings',
  [ModalState.SelectArticle]: 'share article',
  [ModalState.WriteComment]: 'comment',
  [ModalState.Ready]: 'invitation',
};
export const SquadTitle = classed(
  'h3',
  'text-center typo-large-title font-bold',
);
export const SquadSubTitle = classed(
  'p',
  'text-center typo-title3 text-theme-label-tertiary',
);
export const SquadTitleColor = classed('span', 'text-theme-color-cabbage');

export interface SquadStateProps {
  onNext: (squad?: SquadForm) => void;
  form: Partial<SquadForm>;
  onUpdateForm: React.Dispatch<React.SetStateAction<Partial<SquadForm>>>;
  onRequestClose?: () => void;
}

export const quitSquadModal: PromptOptions = {
  title: 'Are you sure?',
  description: <p>You can always create a new Squad from the left sidebar</p>,
  className: {
    buttons: 'flex-row-reverse',
  },
  cancelButton: {
    title: 'Stay',
    className: 'btn-primary-cabbage',
  },
  okButton: {
    title: 'Close',
    className: 'btn-secondary',
  },
};

export const ManageSquadPageContainer = classed(
  BasePageContainer,
  '!p-0 laptop:min-h-page h-full !max-w-[42.5rem] !w-full',
  pageBorders,
);

export const ManageSquadPageMain = classed('div', 'flex flex-1 flex-col');

export const ManageSquadPageFooter = classed(
  'footer',
  'flex sticky flex-row gap-3 items-center py-4 px-6 h-16 border-t border-theme-divider-tertiary',
);

export const ManageSquadPageHeader = classed(
  'header',
  'flex sticky flex-row gap-3 items-center py-4 px-6 h-16 border-b border-theme-divider-tertiary',
);
