<?php

namespace Database\Seeders;

use App\Models\MotivationalQuote;
use Illuminate\Database\Seeder;

class MotivationalQuoteSeeder extends Seeder
{
    /**
     * @var list<array{0: string, 1: string|null}>
     */
    public const array QUOTES = [
        ['El único entrenamiento malo es el que no hiciste.', null],
        ['La disciplina es elegir entre lo que quieres ahora y lo que quieres más.', 'Abraham Lincoln'],
        ['No cuentes los días, haz que los días cuenten.', 'Muhammad Ali'],
        ['Odiaba cada minuto de entrenamiento, pero me decía: no abandones, sufre ahora y vive el resto de tu vida como un campeón.', 'Muhammad Ali'],
        ['El dolor que sientes hoy será la fuerza que sentirás mañana.', null],
        ['Tu cuerpo puede aguantar casi todo. Es a tu mente a la que tienes que convencer.', null],
        ['No se trata de ser el mejor, sino de ser mejor que ayer.', null],
        ['La motivación te pone en marcha; el hábito te mantiene en movimiento.', 'Jim Ryun'],
        ['El éxito no es casualidad: es trabajo duro, perseverancia y aprendizaje.', 'Pelé'],
        ['Si no te desafía, no te cambia.', 'Fred DeVito'],
        ['Cada repetición cuenta. Cada serie te acerca.', null],
        ['La fuerza no viene de la capacidad física, sino de una voluntad indomable.', 'Mahatma Gandhi'],
        ['Suda hoy, sonríe mañana.', null],
        ['Los campeones siguen jugando hasta que lo hacen bien.', 'Billie Jean King'],
        ['El cuerpo logra lo que la mente cree.', null],
        ['Entrena como si nadie te viera; compite como si todos lo hicieran.', null],
        ['Lo difícil se hace de inmediato; lo imposible tarda un poco más.', null],
        ['Un kilo más, una repetición más, un día más.', null],
        ['La constancia vence al talento cuando el talento no es constante.', null],
        ['No pares cuando estés cansado, para cuando hayas terminado.', 'David Goggins'],
        ['Cuanto más sudas en el entrenamiento, menos sangras en la batalla.', null],
        ['El progreso, no la perfección.', null],
        ['El hierro nunca miente.', 'Henry Rollins'],
        ['Hoy es un buen día para superar tu marca personal.', null],
        ['Pequeños avances diarios suman grandes resultados.', null],
        ['Nadie dijo que fuera fácil, dijeron que valdría la pena.', null],
        ['El mejor proyecto en el que trabajarás eres tú.', null],
        ['La única forma de definir tus límites es superándolos.', 'Arthur C. Clarke'],
        ['Corre cuando puedas, camina si tienes que hacerlo, arrástrate si es necesario, pero nunca te rindas.', 'Dean Karnazes'],
        ['El kilómetro más difícil es el que te saca por la puerta.', null],
        ['Correr es el mejor remedio para la mente.', null],
        ['No hay atajos para ningún lugar al que merezca la pena ir.', 'Beverly Sills'],
        ['Tu única competencia eres tú mismo.', null],
        ['Hazlo por la persona en la que te estás convirtiendo.', null],
        ['Las excusas no queman calorías.', null],
        ['Los resultados llegan a quienes no se rinden.', null],
        ['La fatiga es temporal, el orgullo es para siempre.', null],
        ['Entrena duro, descansa mejor, repite.', null],
        ['Si fuera fácil, todos lo harían.', null],
        ['El éxito es la suma de pequeños esfuerzos repetidos día tras día.', 'Robert Collier'],
        ['Cree en ti y serás imparable.', null],
        ['Donde termina tu zona de confort empieza tu progreso.', null],
        ['Una hora de entrenamiento es solo el 4 % de tu día.', null],
        ['No desees que sea más fácil; desea ser mejor.', 'Jim Rohn'],
        ['El sudor es la grasa llorando.', null],
        ['Lo que hoy te cuesta, mañana será tu calentamiento.', null],
        ['Si quieres algo que nunca has tenido, haz algo que nunca has hecho.', null],
        ['El talento gana partidos, pero el trabajo en equipo y la inteligencia ganan campeonatos.', 'Michael Jordan'],
        ['He fallado una y otra vez en mi vida; por eso tengo éxito.', 'Michael Jordan'],
        ['La victoria es de los más perseverantes.', 'Napoleón Bonaparte'],
        ['No importa lo lento que vayas mientras no te detengas.', 'Confucio'],
        ['El dolor es temporal. Rendirse dura para siempre.', 'Lance Armstrong'],
        ['Cuida tu cuerpo: es el único lugar que tienes para vivir.', 'Jim Rohn'],
        ['Hoy entrenas para la versión de ti que quieres ser mañana.', null],
        ['Wall balls, trineos y kilómetros: Hyrox se gana con constancia.', null],
        ['Cada estación es una oportunidad para demostrar de qué estás hecho.', null],
        ['Tu ritmo, tu carrera, tu victoria.', null],
        ['La sobrecarga progresiva es la ley: un poco más cada semana.', null],
        ['Descansar también es entrenar.', null],
        ['Fuerte no es una talla, es una actitud.', null],
        ['El que madruga entrena antes.', null],
        ['El primer paso no te lleva a donde quieres, pero te saca de donde estás.', null],
        ['La meta está más cerca de lo que crees.', null],
        ['Celebra cada récord personal, por pequeño que sea.', null],
        ['Ser constante es más importante que ser intenso.', null],
        ['Tus músculos crecen cuando descansas, tu carácter cuando no te rindes.', null],
        ['La técnica primero, el peso después.', null],
        ['No busques motivación, construye disciplina.', null],
        ['Un entrenamiento a la vez. Una semana a la vez.', null],
        ['Haz que tu yo del futuro te dé las gracias.', null],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (self::QUOTES as [$text, $author]) {
            MotivationalQuote::query()->firstOrCreate(['text' => $text], ['author' => $author]);
        }
    }
}
