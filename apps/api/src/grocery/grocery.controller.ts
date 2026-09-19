import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import {
  AddGroceryItemDto,
  CreateFromRecipeDto,
  CreateGroceryListDto,
  RenameGroceryListDto,
  ToggleGroceryItemDto,
} from './dto/grocery.dto';
import { GroceryService } from './grocery.service';

@Controller('grocery')
@UseGuards(AuthGuard)
export class GroceryController {
  constructor(private readonly groceryService: GroceryService) {}

  @Post()
  create(@Body() dto: CreateGroceryListDto, @Req() req: { userId: string }) {
    return this.groceryService.create(req.userId, dto);
  }

  @Post('from-recipe/:recipeId')
  createFromRecipe(
    @Param('recipeId') recipeId: string,
    @Body() dto: CreateFromRecipeDto,
    @Req() req: { userId: string },
  ) {
    return this.groceryService.createFromRecipe(req.userId, recipeId, dto.name);
  }

  @Get('users/:userId')
  findByUser(
    @Param('userId') userId: string,
    @Req() req: { userId: string },
  ) {
    return this.groceryService.findByUser(userId, req.userId);
  }

  @Get(':listId')
  findOne(
    @Param('listId') listId: string,
    @Req() req: { userId: string },
  ) {
    return this.groceryService.findById(listId, req.userId);
  }

  @Patch(':listId')
  rename(
    @Param('listId') listId: string,
    @Body() dto: RenameGroceryListDto,
    @Req() req: { userId: string },
  ) {
    return this.groceryService.rename(listId, dto.name, req.userId);
  }

  @Delete(':listId')
  deleteList(
    @Param('listId') listId: string,
    @Req() req: { userId: string },
  ) {
    return this.groceryService.deleteList(listId, req.userId);
  }

  @Post(':listId/items')
  addItem(
    @Param('listId') listId: string,
    @Body() dto: AddGroceryItemDto,
    @Req() req: { userId: string },
  ) {
    return this.groceryService.addItem(listId, dto, req.userId);
  }

  @Delete('items/:itemId')
  removeItem(
    @Param('itemId') itemId: string,
    @Req() req: { userId: string },
  ) {
    return this.groceryService.removeItem(itemId, req.userId);
  }

  @Patch('items/toggle')
  toggleItem(
    @Body() dto: ToggleGroceryItemDto,
    @Req() req: { userId: string },
  ) {
    return this.groceryService.toggleItem(dto.itemId, dto.isChecked, req.userId);
  }
}
