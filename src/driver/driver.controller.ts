import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DriverService } from './driver.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Driver, Prisma } from '@prisma/client';
import { ResponseBody } from 'src/types/response.body';
import { DriverModule } from './driver.module';
import { AuthGuard } from 'src/auth/auth.guard';

@ApiTags('driver')
@Controller('driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post('')
  @ApiOperation({ summary: 'Criar motorista' })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createDriver(
    @Body() driverData: Prisma.DriverCreateInput,
  ): Promise<ResponseBody> {
    await this.driverService.createDriver(driverData);
    return {
      message: 'Motorista criado com Sucesso !',
      code: HttpStatus.CREATED,
    };
  }

  @Get('/all')
  @ApiOperation({ summary: 'Listar todos os motoristas' })
  @UseGuards(AuthGuard)
  async getAllDrivers(): Promise<Omit<Driver, 'password'>[]> {
    const drivers = await this.driverService.allDrivers();
    return drivers.map((driver) => {
      const { password, ...driverWithoutPassword } = driver;
      return driverWithoutPassword;
    });
  }

  @Get('/recent')
  @ApiOperation({ summary: 'Listar motoristas recentes' })
  @UseGuards(AuthGuard)
  async getAllRecentDrivers(): Promise<Omit<Driver, 'password'>[]> {
    const drivers = await this.driverService.allRecentDrivers();
    return drivers.map((driver) => {
      const { password, ...driverWithoutPassword } = driver;
      return driverWithoutPassword;
    });
  }

  @Get('count-active')
  @ApiOperation({ summary: 'Contar motoristas ativos' })
  @UseGuards(AuthGuard)
  async countActiveDrivers(): Promise<{ count: number }> {
    return await this.driverService.countActiveDrivers();
  }

  @Get('count')
  @ApiOperation({ summary: 'Contar todos os motoristas' })
  @UseGuards(AuthGuard)
  async countDrivers(): Promise<{ count: number }> {
    return await this.driverService.countDrivers();
  }

  @Get('count-inactive')
  @ApiOperation({ summary: 'Contar motoristas inativos' })
  @UseGuards(AuthGuard)
  async countInactiveDrivers(): Promise<{ count: number }> {
    return await this.driverService.countInactiveDrivers();
  }

  @Get('count-pending')
  @ApiOperation({ summary: 'Motoristas pendentes' })
  @UseGuards(AuthGuard)
  async countPendingDrivers(): Promise<{ count: number; drivers: Driver[] }> {
    return await this.driverService.countPendingDrivers();
  }

  @Get('count-recent')
  @ApiOperation({ summary: 'Contar motoristas recentes' })
  @UseGuards(AuthGuard)
  async countRecentDrivers(): Promise<{ count: number }> {
    return await this.driverService.countRecentDrivers();
  }

  @Get('count-effectives')
  @ApiOperation({ summary: 'Contar motoristas efetivados' })
  @UseGuards(AuthGuard)
  async countEffectivatedDrivers(): Promise<{ count: number }> {
    return await this.driverService.countEffectivatedDrivers();
  }

  @Get('bus-assigned')
  @ApiOperation({ summary: 'Motoristas com autocarro atribuído' })
  @UseGuards(AuthGuard)
  async getAssignedBusDrivers() {
    const drivers = await this.driverService.assignedBusDriver();
    return drivers.map((driver) => {
      const { ...driverWithoutPassword } = driver;
      return driverWithoutPassword;
    });
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Obter motorista por ID' })
  @UseGuards(AuthGuard)
  async getDriverById(
    @Param('id') id: string,
  ): Promise<ResponseBody | Omit<Driver, 'password'>> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: `ID inválido: ${id}`,
      };
    }
    const driver = await this.driverService.driver({
      id: numericId,
    });
    if (!driver) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: `Motorista com ID ${id} não encontrado`,
      };
    }
    const { password, ...driverWithoutPassword } = driver;
    return driverWithoutPassword;
  }

  @Get('/available')
  @ApiOperation({ summary: 'Motoristas disponíveis' })
  @UseGuards(AuthGuard)
  async getAvailableDrivers(): Promise<Omit<Driver, 'password'>[]> {
    const drivers = await this.driverService.getDriversAvailable();
    return drivers.map((driver) => {
      const { password, ...driverWithoutPassword } = driver;
      return driverWithoutPassword;
    });
  }

  @Get('/working')
  @ApiOperation({ summary: 'Motoristas em rota' })
  @UseGuards(AuthGuard)
  async getWorkingDrivers(): Promise<Omit<Driver, 'password'>[]> {
    const drivers = await this.driverService.getDriversOnRoute();
    return drivers.map((driver) => {
      const { password, ...driverWithoutPassword } = driver;
      return driverWithoutPassword;
    });
  }

  @Post('assign-bus/:id')
  @ApiOperation({ summary: 'Atribuir autocarro ao motorista por NIA' })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async assignBusToDriver(
    @Param('id') id: string,
    @Body('busNia') busNia: string,
  ): Promise<ResponseBody> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return { code: HttpStatus.BAD_REQUEST, message: `ID inválido: ${id}` };
    }

    const response = await this.driverService.assignBus(numericId, busNia);

    if (response) {
      return {
        code: HttpStatus.OK,
        message: 'Autocarro Atribuido com Sucesso !',
      };
    }

    return {
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Não foi possível atribuir o autocarro',
    };
  }

  @Patch('/update/:id')
  @ApiOperation({ summary: 'Atualizar motorista' })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateDriver(
    @Param('id') id: string,
    @Body() updateDriverData: Prisma.DriverUpdateInput,
  ): Promise<ResponseBody> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return { code: HttpStatus.BAD_REQUEST, message: `ID inválido: ${id}` };
    }
    const driver = await this.driverService.updateDriver({
      where: { id: numericId },
      data: updateDriverData,
    });

    return {
      message: 'Motorista atualizado com sucesso',
      code: HttpStatus.OK,
    };
  }

  @Patch('/password/:id')
  @ApiOperation({ summary: 'Alterar password do motorista' })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Param('id') id: string,
    @Body() updatePasswordData: { password: string },
  ): Promise<ResponseBody> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return { code: HttpStatus.BAD_REQUEST, message: `ID inválido: ${id}` };
    }

    const driver = await this.driverService.updatePassword({
      where: { id: numericId },
      data: { password: updatePasswordData.password },
    });
    const { password, ...driverWithoutPassword } = driver;
    return {
      message: 'Senha atualizada com sucesso',
      code: HttpStatus.OK,
    };
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Remover motorista' })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteDriver(@Param('id') id: string): Promise<ResponseBody> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return { code: HttpStatus.BAD_REQUEST, message: `ID inválido: ${id}` };
    }
    await this.driverService.deleteDriver({ id: numericId });
    return {
      message: 'Motorista deletado com sucesso',
      code: HttpStatus.OK,
    };
  }

  @Patch('/status/:id')
  @ApiOperation({ summary: 'Atualizar status do motorista' })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusData: { status: 'AVAILABLE' | 'ON_ROUTE' | 'OFFLINE' },
  ): Promise<ResponseBody> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return { code: HttpStatus.BAD_REQUEST, message: `ID inválido: ${id}` };
    }
    const driver = await this.driverService.updateStatus(
      numericId,
      updateStatusData.status,
    );
    if (!driver) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: `Motorista com ID ${id} não encontrado`,
      };
    }
    const { password, ...driverWithoutPassword } = driver;
    return {
      message: 'Status do motorista atualizado com sucesso',
      code: HttpStatus.OK,
    };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Get('me/:driverId')
  async profileDetails(@Param('driverId') id: string) {
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || !id) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: `ID inválido: ${id}`,
      };
    }

    return this.driverService.getDriverDetails(numericId);
  }

  @Patch('/verify/:id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyDriver(@Param('id') id: string): Promise<ResponseBody> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return { code: HttpStatus.BAD_REQUEST, message: `ID inválido: ${id}` };
    }
    const driver = await this.driverService.verifyDriver({
      id: numericId,
    });
    return {
      message: `Motorista ${driver.isVerified ? 'verificado' : 'desverificado'} com sucesso`,
      code: HttpStatus.OK,
    };
  }

  @Patch('/unassign-bus/:id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async unassignBus(@Param('id') id: string): Promise<ResponseBody> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return { code: HttpStatus.BAD_REQUEST, message: `ID inválido: ${id}` };
    }
    const driver = await this.driverService.unassignBus(numericId);
    return {
      message: 'Atribuição de autocarro removida com sucesso',
      code: HttpStatus.OK,
    };
  }

  //Acho que não vamos usar, mas deixa só deixar aqui por preucação
  @Patch('/location/:id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateLocation(
    @Param('id') id: string,
    @Body() updateLocationData: { latitude: number; longitude: number },
  ): Promise<ResponseBody> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return { code: HttpStatus.BAD_REQUEST, message: `ID inválido: ${id}` };
    }
    const driver = await this.driverService.updateLocation(
      numericId,
      updateLocationData.latitude,
      updateLocationData.longitude,
    );
    const { password, ...driverWithoutPassword } = driver;
    return {
      message: 'Localização do motorista atualizada com sucesso',
      code: HttpStatus.OK,
    };
  }

  @Get('location/:id')
  @UseGuards(AuthGuard)
  async getLocation(
    @Param('id') id: string,
  ): Promise<ResponseBody | { latitude: number; longitude: number }> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return { code: HttpStatus.BAD_REQUEST, message: `ID inválido: ${id}` };
    }
    return await this.driverService.getLocation(numericId);
  }
}
