const signalData = require('./signal_data.json')

const OBJ_VAR_NAME = 'obj'
// Static classes cannot be extended
const CLASS_BLACKLIST = [
  'AudioServer',
  'ARVRServer',
  'CameraServer',
  'Input',
  'VisualServer', 
  '_VisualScriptEditor'
]

const TYPE_MAP = {
  0: "object",
  1: "bool",
  2: "int",
  3: "float",
  4: "string",
  5: "Vector2",
  6: "Rect2",
  7: "Vector3",
  8: "Transform2D",
  9: "Plane",
  10: "Quat",
  11: "AABB",
  12: "Basis",
  13: "Transform",
  14: "Color",
  15: "NodePath",
  16: "RID",
  17: "Object",
  18: "Dictionary",
  19: "Array",
  20: "byte[]",
  21: "int[]",
  22: "float[]",
  23: "string[]",
  24: "Vector2[]",
  25: "Vector3[]",
  26: "Color[]"
}

function snakeToPascal(str) {
  return str
    .replace(/^_/g, '')
    .split('_')
    .map(s => s[0].toUpperCase() + s.substr(1))
    .join('')
}

function stringifyType({ type: id, cls }) {
  if (id === 17 && cls.length > 0) {
    return `Godot.${cls}`
  }
  return TYPE_MAP[id]
}

function funcDecl(className, signalName, args) {
  var generics = ""
  var callGenerics = ""

  if (args.length === 1) {
    generics = stringifyType(args[0])
    callGenerics = `<${generics}>`
  } else if (args.length > 1) {
    generics = args
      .map(arg => ({
        type: stringifyType(arg),
        name: snakeToPascal(arg.name)
      }))
      .map(arg => `${arg.type} ${arg.name}`)
      .join(', ')

    callGenerics = args
      .map(arg => stringifyType(arg))
      .join(', ')
    
    generics = `(${generics})`
    callGenerics = `<${callGenerics}>`
  }

  var returnType = `IObservable<${generics || 'Unit'}>`
  
  return `
public static ${returnType} On${snakeToPascal(signalName)}(this Godot.${className} ${OBJ_VAR_NAME})
  => ${OBJ_VAR_NAME}.ObserveSignal${callGenerics}("${signalName}");
`.trim();
}

let maxArgs = 0

for (let className in signalData) {
  if (CLASS_BLACKLIST.includes(className))
    continue

  for (let signalName in signalData[className]) {
    var args = signalData[className][signalName]
    maxArgs = Math.max(maxArgs, args.length)

    var decl = funcDecl(className, signalName, args)
    console.log(decl)
  }
}

// console.log('\n')
// console.log(`Max args: ${maxArgs}`)
