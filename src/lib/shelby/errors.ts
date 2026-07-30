export class ShelbyUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShelbyUploadError';
  }
}

export class ShelbyDownloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShelbyDownloadError';
  }
}

export class ShelbyNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShelbyNetworkError';
  }
}

export class ShelbyAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShelbyAuthError';
  }
}
