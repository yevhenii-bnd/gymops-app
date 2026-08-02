import { Body, Controller, Get, Headers, HttpCode, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";

import type {
  AuthRefreshResponse,
  AuthSessionResponse,
  StaffIdentityResponse
} from "./auth.types.js";
import { AuthService } from "./auth.service.js";
import { StaffLoginDto } from "./staff-login.dto.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(200)
  async login(
    @Body() dto: StaffLoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthSessionResponse> {
    return this.authService.login(dto, request, response);
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthRefreshResponse> {
    return this.authService.refresh(request, response);
  }

  @Post("logout")
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<void> {
    await this.authService.logout(request, response);
  }

  @Get("me")
  async me(
    @Headers("authorization") authorizationHeader: string | undefined
  ): Promise<StaffIdentityResponse> {
    return this.authService.me(authorizationHeader);
  }
}
