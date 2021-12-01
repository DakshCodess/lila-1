package shogi

import Pos._
import variant.Standard

class AutodrawTest extends ShogiTest {

  "detect automatic draw" should {
    "by lack of pieces" in {
      "empty" in {
        makeEmptyBoard.autoDraw must_== true
      }
      "new" in {
        makeBoard.autoDraw must_== false
      }
      "opened" in {
        makeGame.playMoves(SQ5G -> SQ5F, SQ5C -> SQ5D, SQ7G -> SQ7F, SQ5D -> SQ5E, SQ5F -> SQ5E) map { g =>
          g.board.autoDraw
        } must beValid(false)
      }
      "two kings with nothing in hand" in {
        """
      k
K      """.autoDraw must_== true
      }
      "one pawn" in {
        """
  P   k
K      """.autoDraw must_== false
      }
      "one bishop" in {
        """
      k
K     B""".autoDraw must_== false
      }
      "one knight" in {
        """
      k
K     N""".autoDraw must_== false
      }
    }
    "by fourfold" in {
      val moves = List(
        SQ2H -> SQ3H,
        SQ8B -> SQ7B,
        SQ3H -> SQ2H,
        SQ7B -> SQ8B,
        SQ2H -> SQ3H,
        SQ8B -> SQ7B,
        SQ3H -> SQ2H,
        SQ7B -> SQ8B,
        SQ2H -> SQ3H,
        SQ8B -> SQ7B,
        SQ3H -> SQ2H,
        SQ7B -> SQ8B
      )
      "should be fourfold" in {
        makeGame.playMoves(moves: _*) must beValid.like { case g =>
          g.situation.autoDraw must beTrue
        }
      }
      "should not be fourfold" in {
        makeGame.playMoves(moves.dropRight(1): _*) must beValid.like { case g =>
          g.situation.autoDraw must beFalse
        }
      }
    }
  }
  "do not detect insufficient material" should {
    "on two kings with something in hand" in {
      val position = "4k4/9/9/9/9/9/9/9/5K3 b p 1"
      fenToGame(position, Standard) must beValid.like { case game =>
        game.situation.autoDraw must beFalse
      //game.situation.end must beFalse
      //game.situation.opponentHasInsufficientMaterial must beFalse
      }
    }
    "on a single pawn" in {
      val position = "2p2k3/9/9/9/9/9/9/9/4K4 b - 1"
      val game     = fenToGame(position, Standard)
      val newGame = game flatMap (_.playMove(
        Pos.SQ5I,
        Pos.SQ5H
      ))
      newGame must beValid.like { case game =>
        game.situation.autoDraw must beFalse
        game.situation.end must beFalse
        game.situation.opponentHasInsufficientMaterial must beTrue
      }
    }
  }
}