import { JwtPayload } from ".";

export type JwtPayloadWithRefreshToken = JwtPayload & { refreshToken: string}