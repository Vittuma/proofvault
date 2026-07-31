import { describe, it, expect } from 'vitest';
import { buildShelbyExplorerUrl, buildShelbyDownloadUrl } from './explorer';

describe('Shelby Explorer URL Builder', () => {
  const accountAddress = '0xd5da04aa754c2c30d148221ba9709b4bebf36a5dd8ed2ea8d6e5a557fe5926d2';

  it('builds testnet explorer URL for normal blob name', () => {
    const url = buildShelbyExplorerUrl(accountAddress, 'my_file.txt', 'testnet');
    expect(url).toBe(`https://explorer.shelby.xyz/testnet/account/${accountAddress}/blobs?name=my_file.txt`);
  });

  it('builds testnet explorer URL with spaces', () => {
    const url = buildShelbyExplorerUrl(accountAddress, 'my file name.txt', 'testnet');
    expect(url).toBe(`https://explorer.shelby.xyz/testnet/account/${accountAddress}/blobs?name=my%20file%20name.txt`);
  });

  it('builds testnet explorer URL with tricky characters (single quote, brackets)', () => {
    const url = buildShelbyExplorerUrl(accountAddress, "Blob Man_confused_at_'BUY_DIP'_[2026].jpeg", 'testnet');
    expect(url).toBe(`https://explorer.shelby.xyz/testnet/account/${accountAddress}/blobs?name=Blob%20Man_confused_at_'BUY_DIP'_%5B2026%5D.jpeg`);
  });

  it('builds testnet explorer URL with unicode characters', () => {
    const url = buildShelbyExplorerUrl(accountAddress, 'ảnh_đẹp_tháng_8.png', 'testnet');
    expect(url).toBe(`https://explorer.shelby.xyz/testnet/account/${accountAddress}/blobs?name=%E1%BA%A3nh_%C4%91%E1%BA%B9p_th%C3%A1ng_8.png`);
  });

  it('builds download URL correctly', () => {
    const url = buildShelbyDownloadUrl(accountAddress, 'tricky [name].txt', 'testnet');
    expect(url).toBe(`https://testnet.shelby.io/v1/blobs/${accountAddress}/tricky%20%5Bname%5D.txt`);
  });
});
