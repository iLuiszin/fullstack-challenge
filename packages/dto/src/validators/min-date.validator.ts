import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator'

export function MinDate(
  minDate: Date,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'minDate',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [minDate],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [minDateConstraint] = args.constraints
          if (!(value instanceof Date)) {
            return false
          }
          return value >= minDateConstraint
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must not be in the past`
        },
      },
    })
  }
}
