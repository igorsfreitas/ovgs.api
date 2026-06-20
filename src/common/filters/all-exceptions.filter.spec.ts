import {
  ArgumentsHost,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import {
  AllExceptionsFilter,
  ErrorResponseBody,
} from './all-exceptions.filter';
import { BusinessRuleException } from '../exceptions/business-rule.exception';

function createHost(method = 'GET', url = '/orders') {
  const json = jest.fn((body: ErrorResponseBody) => body);
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method, url }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jest.spyOn(filter['logger'], 'warn').mockImplementation();
    jest.spyOn(filter['logger'], 'error').mockImplementation();
  });

  it('maps an HttpException preserving its status and message', () => {
    const { host, status, json } = createHost('GET', '/customers/1');

    filter.catch(new NotFoundException('Customer not found'), host);

    expect(status).toHaveBeenCalledWith(404);
    const body = json.mock.calls[0][0];
    expect(body.statusCode).toBe(404);
    expect(body.message).toBe('Customer not found');
    expect(body.path).toBe('/customers/1');
    expect(typeof body.timestamp).toBe('string');
  });

  it('maps a business rule violation to 422', () => {
    const { host, status, json } = createHost('POST', '/sales-orders');

    filter.catch(new BusinessRuleException('Transport not authorized'), host);

    expect(status).toHaveBeenCalledWith(422);
    const body = json.mock.calls[0][0];
    expect(body.error).toBe('Business Rule Violation');
    expect(body.message).toBe('Transport not authorized');
  });

  it('preserves a string HttpException response body', () => {
    const { host, status, json } = createHost();

    filter.catch(new HttpException('plain message', 418), host);

    expect(status).toHaveBeenCalledWith(418);
    const body = json.mock.calls[0][0];
    expect(body.message).toBe('plain message');
  });

  it('maps an unknown error to 500 without leaking details and logs the stack', () => {
    const { host, status, json } = createHost('POST', '/boom');
    const errorSpy = jest.spyOn(filter['logger'], 'error');

    filter.catch(new Error('db exploded'), host);

    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0];
    expect(body.statusCode).toBe(500);
    expect(body.message).toBe('Internal server error');
    expect(errorSpy).toHaveBeenCalled();
  });

  it('falls back when the HttpException object body has no message/error', () => {
    const { host, status, json } = createHost('GET', '/x');

    filter.catch(new HttpException({ statusCode: 400 }, 400), host);

    expect(status).toHaveBeenCalledWith(400);
    const body = json.mock.calls[0][0];
    expect(typeof body.message).toBe('string');
    expect(body.error).toBe('BAD_REQUEST');
  });

  it('uses a generic error label for a status outside the HttpStatus enum', () => {
    const { host, status, json } = createHost();

    filter.catch(new HttpException('weird', 499), host);

    expect(status).toHaveBeenCalledWith(499);
    const body = json.mock.calls[0][0];
    expect(body.error).toBe('Error');
    expect(body.message).toBe('weird');
  });

  it('handles a non-Error thrown value as a 500 and logs it', () => {
    const { host, status } = createHost('POST', '/weird');
    const errorSpy = jest.spyOn(filter['logger'], 'error');

    filter.catch('boom string', host);

    expect(status).toHaveBeenCalledWith(500);
    expect(errorSpy).toHaveBeenCalled();
  });
});
