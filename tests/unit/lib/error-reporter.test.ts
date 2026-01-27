import {
  setErrorReporter,
  reportError,
  reportWarning,
  NoOpErrorReporter,
  ConsoleErrorReporter,
} from '@/lib/error-reporter';

describe('error-reporter', () => {
  describe('NoOpErrorReporter', () => {
    it('should not throw when reporting errors', () => {
      const reporter = new NoOpErrorReporter();
      expect(() => reporter.reportError('test error')).not.toThrow();
      expect(() => reporter.reportError('test error', new Error('test'))).not.toThrow();
      expect(() => reporter.reportError('test error', new Error('test'), { key: 'value' })).not.toThrow();
    });

    it('should not throw when reporting warnings', () => {
      const reporter = new NoOpErrorReporter();
      expect(() => reporter.reportWarning('test warning')).not.toThrow();
      expect(() => reporter.reportWarning('test warning', { key: 'value' })).not.toThrow();
    });
  });

  describe('ConsoleErrorReporter', () => {
    let consoleErrorSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should log errors to console', () => {
      const reporter = new ConsoleErrorReporter();
      const error = new Error('test error');
      const context = { key: 'value' };

      reporter.reportError('test message', error, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith('test message', error, context);
    });

    it('should log warnings to console', () => {
      const reporter = new ConsoleErrorReporter();
      const context = { key: 'value' };

      reporter.reportWarning('test warning', context);

      expect(consoleWarnSpy).toHaveBeenCalledWith('test warning', context);
    });
  });

  describe('setErrorReporter and global functions', () => {
    let consoleErrorSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      // Reset to no-op reporter
      setErrorReporter(new NoOpErrorReporter());
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should use no-op reporter by default', () => {
      reportError('test error');
      reportWarning('test warning');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should use console reporter when set', () => {
      setErrorReporter(new ConsoleErrorReporter());

      reportError('test error', new Error('test'));
      reportWarning('test warning');

      expect(consoleErrorSpy).toHaveBeenCalledWith('test error', new Error('test'), undefined);
      expect(consoleWarnSpy).toHaveBeenCalledWith('test warning', undefined);
    });

    it('should allow switching reporters', () => {
      setErrorReporter(new ConsoleErrorReporter());
      reportError('should log');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      setErrorReporter(new NoOpErrorReporter());
      reportError('should not log');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });
});
