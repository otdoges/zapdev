import { Polar } from '@polar-sh/sdk';

const accessToken = process.env.POLAR_ACCESS_TOKEN;

if (!accessToken) {
  console.warn('POLAR_ACCESS_TOKEN is not set. Polar operations will not work.');
}

const polar = accessToken 
  ? new Polar({
      accessToken,
    })
  : null;

export default polar; 