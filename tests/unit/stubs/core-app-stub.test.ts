import { coreAppStub } from '@/stubs/core-app-stub';

describe('Core App Stub', () => {
  it('mounts successfully and renders content', async () => {
    const container = document.createElement('div');

    const result = await coreAppStub.mount(container, {
      basePath: '/',
      initialPath: '/',
      onNavigate: jest.fn(),
      contractVersion: '1',
    });

    expect(result.success).toBe(true);
    expect(container.innerHTML).toContain('Core App Placeholder');
  });

  it('has correct contract version', () => {
    expect(coreAppStub.contractVersion).toBe('1');
  });
});
