import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { BusService } from './bus.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { busDetails } from 'src/types/bus.details';
import { updateBusDetails } from 'src/types/update-bus-details';
import { ResponseBody } from 'src/types/response.body';

@ApiTags('bus')
@Controller('bus')
export class BusController {
  @Inject()
  private readonly busService: BusService;

  @Post('')
  @ApiOperation({ summary: 'Criar autocarro', description: 'Regista um novo autocarro' })
  async createBus(@Body() busData: any): Promise<ResponseBody> {
    const bus = await this.busService.createBus(busData);

    if (!bus) {
      return {
        message: 'Houve um erro ao criar o autocarro. Tente novamente.',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }

    return {
      message: 'Autocarro criado com Sucesso !',
      code: HttpStatus.CREATED,
    };
  }
  @Get('')
  @ApiOperation({ summary: 'Listar autocarros' })
  async buses(): Promise<any[]> {
    return this.busService.buses();
  }
  @Get('with-route')
  @ApiOperation({ summary: 'Listar autocarros com rota associada' })
  async busesWithRoute(): Promise<any[]> {
    return this.busService.busesWithRoute();
  }

  @Get('dashboard-details/:driverId')
  @ApiOperation({ summary: 'Detalhes do autocarro para dashboard de motorista' })
  @UseGuards(AuthGuard)
  async getBusDetails(
    @Param('driverId') driverId: string,
  ): Promise<busDetails | null> {
    const bus = await this.busService.provideBusDetails(Number(driverId));
    if (!bus || !bus.route) {
      return null;
    }
    const busDetails: busDetails = {
      status: bus?.status,
      currentLoad: bus?.currentLoad,
      capacity: bus?.capacity,
      route: {
        destination: bus?.route.destination,
        origin: bus?.route.origin,
        originLat: bus.route.originLatitude,
        originLng: bus.route.originLongitude,
        destinationLat: bus.route.destinationLatitude,
        destinationLng: bus.route.destinationLongitude,
      },
      stops: bus?.route.routeStops.map((rs) => {
        return {
          id: rs.id,
          latitude: rs.stop.latitude,
          longitude: rs.stop.longitude,
          name: rs.stop.name,
          order: null,
        };
      }),
    };

    return busDetails;
  }

  @Patch('dashboard-details/:busId')
  @ApiOperation({ summary: 'Atualizar status/load do autocarro (fluxo de viagem)' })
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async updateBusDetails(
    @Param('busId') busId: string,
    @Body() data: updateBusDetails,
  ): Promise<ResponseBody> {
    const numericId = parseInt(busId, 10);
    if (isNaN(numericId)) {
      return { code: HttpStatus.BAD_REQUEST, message: `ID inválido: ${busId}` };
    }

    const response = await this.busService.updateBusDetails(numericId, data);

    if (!response) {
      return {
        message: 'Erro ao atualizar dado. Tente novamente.',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }

    return {
      message: 'Dados Salvos!.',
      code: HttpStatus.OK,
    };
  }

  @Put('assign-driver/:busId')
  @ApiOperation({ summary: 'Atribuir motorista ao autocarro' })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async assignDriverToBus(
    @Param('busId') busId: string,
    @Body('driverEmail') driverEmail: string,
  ): Promise<ResponseBody> {
    const numericId = parseInt(busId, 10);
    if (isNaN(numericId)) {
      return { code: HttpStatus.BAD_REQUEST, message: `ID inválido: ${busId}` };
    }

    const response = await this.busService.assignDriver(numericId, driverEmail);

    if (response) {
      return {
        code: HttpStatus.OK,
        message: 'Motorista Atribuido com Sucesso !',
      };
    }

    return {
      code: 500,
      message: 'Não foi possível atribuir o Motorista',
    };
  }

  @Patch('status/:driverId')
  @ApiOperation({ summary: 'Alterar status do autocarro via driverId' })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeBusStatus(
    @Param('driverId') driverId: string,
    @Body() body: any,
  ): Promise<ResponseBody> {
    const response = await this.busService.changeStatus(Number(driverId), body);

    if (response) {
      return {
        code: HttpStatus.OK,
        message: 'Status do autocarro alterado',
      };
    }

    return {
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Não foi possível alterar o status do autocarro',
    };
  }

  @Patch('route/:driverId/:routeId')
  @ApiOperation({ summary: 'Alterar rota do autocarro' })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async changeBusRoute(
    @Param('driverId') driverId: string,
    @Param('routeId') newRouteId: string,
  ): Promise<ResponseBody> {
    const response = await this.busService.changeRoute(
      Number(driverId),
      Number(newRouteId),
    );

    if (response) {
      return {
        code: HttpStatus.OK,
        message: 'Dados Salvos !',
      };
    }

    return {
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Erro ao atualizar rota. Tente novamente.',
    };
  }

  @Get('count')
  @ApiOperation({ summary: 'Contar autocarros' })
  @UseGuards(AuthGuard)
  async countBuses(): Promise<{ count: number }> {
    return await this.busService.countBuses();
  }

  @Get('pending')
  @ApiOperation({ summary: 'Autocarros sem motorista' })
  @UseGuards(AuthGuard)
  async pendingBuses(): Promise<{ count: number; buses: any[] }> {
    return await this.busService.pendingBuses();
  }

  @Patch('update/:busId')
  @ApiOperation({ summary: 'Atualizar dados do autocarro' })
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async updateBus(
    @Param('busId') busId: string,
    @Body() data: any,
  ): Promise<ResponseBody> {
    const numericId = parseInt(busId, 10);
    if (isNaN(numericId)) {
      return { code: HttpStatus.BAD_REQUEST, message: `ID inválido: ${busId}` };
    }

    const response = await this.busService.updateBus(numericId, data);

    if (!response) {
      return {
        message: 'Erro ao atualizar. Tente novamente.',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }

    return {
      message: 'Dados Salvos!.',
      code: HttpStatus.OK,
    };
  }

  @Get('count-inactive')
  @UseGuards(AuthGuard)
  async countInactiveBuses(): Promise<{ count: number; buses: any[] }> {
    return await this.busService.countInactiveBuses();
  }
  @Get('count-active')
  @UseGuards(AuthGuard)
  async countAvailableBuses(): Promise<{ count: number; buses: any[] }> {
    return await this.busService.countAvailableBuses();
  }
}
