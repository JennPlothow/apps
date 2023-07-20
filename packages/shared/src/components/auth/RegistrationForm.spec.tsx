import React from 'react';
import {
  fireEvent,
  render,
  RenderResult,
  screen,
  waitFor,
} from '@testing-library/preact';
import nock from 'nock';
import { QueryClient, QueryClientProvider } from 'react-query';
import { waitForNock } from '../../../__tests__/helpers/utilities';
import {
  mockEmailCheck,
  mockLoginFlow,
  mockRegistraitonFlow,
  registrationFlowMockData,
  successfulRegistrationMockData,
} from '../../../__tests__/fixture/auth';
import { getNodeValue, RegistrationParameters } from '../../lib/auth';
import { AuthContextProvider } from '../../contexts/AuthContext';
import { formToJson } from '../../lib/form';
import AuthOptions, { AuthOptionsProps } from './AuthOptions';
import { getUserDefaultTimezone } from '../../lib/timezones';
import SettingsContext from '../../contexts/SettingsContext';
import { mockGraphQL } from '../../../__tests__/helpers/graphql';
import { GET_USERNAME_SUGGESTION } from '../../graphql/users';
import Toast from '../notifications/Toast';

const client = new QueryClient();

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  nock.cleanAll();
  client.clear();
});

const defaultToken = getNodeValue(
  'csrf_token',
  registrationFlowMockData.ui.nodes,
);
const trackingId = 'id';
const defaultParams: Partial<RegistrationParameters> = {
  csrf_token: defaultToken,
  provider: undefined,
  method: 'password',
  'traits.image': undefined,
  'traits.userId': trackingId,
  'traits.acceptedMarketing': true,
  'traits.timezone': getUserDefaultTimezone(),
};
const mockRegistraitonValidationFlow = (
  result: unknown,
  { optOutMarketing, ...params }: Partial<RegistrationParameters> = {},
  responseCode = 200,
) => {
  const url = new URL(registrationFlowMockData.ui.action);
  const vars = { ...defaultParams, ...params };
  nock(url.origin, {
    reqheaders: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': vars.csrf_token,
      Accept: 'application/json',
    },
  })
    .post(url.pathname + url.search, vars)
    .reply(responseCode, result);
};

const renderComponent = (
  props: AuthOptionsProps = {
    onDisplayChange: jest.fn(),
    trigger: null,
    formRef: null,
  },
): RenderResult => {
  mockLoginFlow();
  mockRegistraitonFlow();
  return render(
    <QueryClientProvider client={client}>
      <AuthContextProvider
        user={{ id: trackingId }}
        updateUser={jest.fn()}
        tokenRefreshed
        getRedirectUri={jest.fn()}
        loadingUser={false}
        loadedUserFromCache
        refetchBoot={jest.fn()}
      >
        <SettingsContext.Provider value={{ syncSettings: jest.fn() }}>
          <Toast autoDismissNotifications={false} />
          <AuthOptions {...props} />
        </SettingsContext.Provider>
      </AuthContextProvider>
    </QueryClientProvider>,
  );
};

const simulateTextboxInput = (el: HTMLTextAreaElement, key: string) => {
  el.focus();
  el.blur();
  // eslint-disable-next-line no-param-reassign
  el.value += key;
};

const renderRegistration = async (
  email = 'sshanzel@yahoo.com',
  existing = false,
  name = 'Lee Solevilla',
  username = 'leesolevilla',
) => {
  renderComponent();
  await waitForNock();
  mockEmailCheck(email, existing);
  fireEvent.input(screen.getByPlaceholderText('Email'), {
    target: { value: email },
  });
  const submit = await screen.findByTestId('email_signup_submit');
  fireEvent.click(submit);
  await waitForNock();
  let queryCalled = false;
  mockGraphQL({
    request: {
      query: GET_USERNAME_SUGGESTION,
      variables: { name },
    },
    result: () => {
      queryCalled = true;
      return { data: { generateUniqueUsername: username } };
    },
  });
  await waitFor(() => expect(screen.getByText('Sign up to daily.dev')));
  const nameInput = screen.getByPlaceholderText('Full name');
  fireEvent.input(screen.getByPlaceholderText('Enter a username'), {
    target: { value: username },
  });
  fireEvent.input(screen.getByPlaceholderText('Full name'), {
    target: { value: name },
  });
  simulateTextboxInput(nameInput as HTMLTextAreaElement, name);
  fireEvent.input(screen.getByPlaceholderText('Create a password'), {
    target: { value: '#123xAbc' },
  });

  await waitForNock();
  await waitFor(() => expect(queryCalled).toBeTruthy());
};

// NOTE: Chris turned this off needs a good re-look at
// it('should post registration', async () => {
//   const email = 'sshanzel@yahoo.com';
//   await renderRegistration(email);
//   const form = await screen.findByTestId('registration_form');
//   const params = formToJson(form as HTMLFormElement);
//   mockRegistraitonValidationFlow(successfulRegistrationMockData, params);
//   fireEvent.submit(form);
//   await waitForNock();
//   await waitFor(() => {
//     const sentText = screen.queryByText('We just sent an email to:');
//     expect(sentText).toBeInTheDocument();
//     const emailText = screen.queryByText(email);
//     expect(emailText).toBeInTheDocument();
//   });
// });

// NOTE: Chris turned this off needs a good re-look at
// it('should display error messages', async () => {
//   const email = 'sshanzel@yahoo.com';
//   const errorMessage =
//     'The password can not be used because password length must be at least 8 characters but only got 3.';
//   await renderRegistration(email);
//   const form = await screen.findByTestId('registration_form');
//   const params = formToJson(form as HTMLFormElement);
//   mockRegistraitonValidationFlow(errorRegistrationMockData, params, 400);
//   fireEvent.submit(form);
//   await waitForNock();
//   await waitFor(() => {
//     const text = screen.queryByText(errorMessage);
//     expect(text).toBeInTheDocument();
//   });
// });

it('should show login if email exists', async () => {
  const email = 'sshanzel@yahoo.com';
  renderComponent();
  await waitForNock();
  fireEvent.input(screen.getByPlaceholderText('Email'), {
    target: { value: email },
  });
  const submit = await screen.findByTestId('email_signup_submit');
  fireEvent.click(submit);
  mockEmailCheck(email, true);

  await waitFor(() => {
    const text = screen.queryByText('Log in with Facebook');
    const toastText = screen.queryByText(
      "There's already an account for the same credentials. Can you please try logging in instead?",
    );
    expect(text).toBeInTheDocument();
    expect(toastText).toBeInTheDocument();
  });
});

describe('testing username auto generation', () => {
  it('should suggest a valid option', async () => {
    const email = 'sshanzel@yahoo.com';
    const name = 'John Doe';
    const username = 'johndoe';

    await renderRegistration(email, false, name, username);
    const form = await screen.findByTestId('registration_form');
    const params = formToJson(form as HTMLFormElement);
    mockRegistraitonValidationFlow(successfulRegistrationMockData, params);
    fireEvent.submit(form);

    await waitFor(() => {
      const usernameEl = screen.getByPlaceholderText('Enter a username');
      expect(usernameEl).toBeInTheDocument();
      expect(usernameEl).toHaveValue(username);
    });
  });
});
