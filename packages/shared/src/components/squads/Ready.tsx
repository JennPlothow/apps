import React, { ReactElement, useContext, useRef } from 'react';
import { Modal } from '../modals/common/Modal';
import { Button } from '../buttons/Button';
import LinkIcon from '../icons/Link';
import { Squad } from '../../graphql/sources';
import SquadReadySvg from '../../svg/SquadReady';
import Alert, { AlertType } from '../widgets/Alert';
import {
  ModalState,
  SquadStateProps,
  SquadTitle,
  SquadTitleColor,
} from './utils';
import { ModalPropsContext } from '../modals/common/types';
import { InviteTextField, InviteTextFieldHandle } from './InviteTextField';
import { Origin } from '../../lib/analytics';

interface SquadReadyProps extends SquadStateProps {
  squad?: Squad;
}

export function SquadReady({ squad }: SquadReadyProps): ReactElement {
  const { activeView } = useContext(ModalPropsContext);
  if (ModalState.Ready !== activeView) return null;
  const { name, handle } = squad;
  // @NOTE see https://dailydotdev.atlassian.net/l/cp/dK9h1zoM
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const inviteTextRef = useRef<InviteTextFieldHandle>();

  return (
    <>
      <Modal.Body className="flex flex-col items-center">
        <SquadTitle>
          Invite your Squad <SquadTitleColor>members</SquadTitleColor>
        </SquadTitle>
        <SquadReadySvg className="mt-6 mb-4" />
        <h3 className="font-bold typo-title2">{name}</h3>
        <h4>@{handle}</h4>
        <InviteTextField
          squad={squad}
          ref={inviteTextRef}
          origin={Origin.SquadCreation}
        />
        <Alert
          className="mt-4"
          type={AlertType.Info}
          title="Your Squad's dedicated space will open up once a new member joins. We will notify you when it happens."
        />
      </Modal.Body>
      <Modal.Footer>
        <Button
          icon={<LinkIcon />}
          className="flex-1 mx-4 btn-primary-cabbage"
          onClick={() => inviteTextRef.current?.copyLink()}
        >
          Copy invitation link
        </Button>
      </Modal.Footer>
    </>
  );
}
