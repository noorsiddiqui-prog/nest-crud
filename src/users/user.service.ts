import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()

export class UserService {
    private users: any[] = [];

    create(dto: CreateUserDto) {
        const user = {
            id: Date.now(),
            ...dto
        }

        this.users.push(user);
        return user;
    }

    findAll() {
        return this.users;
    }

    findOne(id: number) {
        return this.users.find((user => user.id === id));
    }

    update(id: number, dto: UpdateUserDto) {
        const user = this.findOne(id);

        if (!user) {
            return null;
        }

        Object.assign(user, dto);

        return user;
    }

    remove(id: number) {
        this.users = this.users.filter((user => user.id !== id));

        return {
            message: `User with id ${id} has been removed`
        }
    }
}